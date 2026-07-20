param(
  [switch]$PreflightOnly,
  [switch]$SmokeTest
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path
$processes = @()

function Get-ProcessRecord([int]$ProcessId) {
  Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop
}

function Test-RepoOwnedProcess([int]$ProcessId) {
  $record = Get-ProcessRecord $ProcessId
  $commandLine = [string]$record.CommandLine
  return $commandLine.ToLowerInvariant().Contains($root.ToLowerInvariant())
}

function Stop-ProcessTree([int]$ProcessId) {
  $children = @(Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue)
  foreach ($child in $children) {
    Stop-ProcessTree ([int]$child.ProcessId)
  }

  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Wait-ForPortToClose([int]$Port) {
  $deadline = (Get-Date).AddSeconds(10)
  do {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) { return }
    Start-Sleep -Milliseconds 250
  } while ((Get-Date) -lt $deadline)

  throw "Port $Port did not become available after stopping the stale BOSS process."
}

function Clear-StaleRepoListener([int]$Port, [string]$Service) {
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $listener) {
    Write-Host "[$Service] port $Port is available"
    return
  }

  $processId = [int]$listener.OwningProcess
  $record = Get-ProcessRecord $processId
  if (-not (Test-RepoOwnedProcess $processId)) {
    $executable = if ($record.ExecutablePath) { $record.ExecutablePath } else { $record.Name }
    throw "Port $Port is owned by unrelated process PID $processId ($executable). Stop or reconfigure that process, then retry. Nothing was terminated."
  }

  Write-Host "[$Service] stopping stale BOSS listener PID $processId on port $Port"
  Stop-ProcessTree $processId
  Wait-ForPortToClose $Port
}

function Wait-ForEndpoint([string]$Name, [string]$Url, [System.Diagnostics.Process[]]$TrackedProcesses) {
  $deadline = (Get-Date).AddSeconds(60)
  do {
    foreach ($tracked in $TrackedProcesses) {
      $tracked.Refresh()
      if ($tracked.HasExited) {
        throw "$Name startup failed because process $($tracked.Id) exited with code $($tracked.ExitCode)."
      }
    }

    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Write-Host "[$Name] ready at $Url"
        return
      }
    }
    catch {
      Start-Sleep -Milliseconds 500
    }
  } while ((Get-Date) -lt $deadline)

  throw "$Name did not become ready at $Url within 60 seconds."
}

function Get-MissingEnvironmentNames([string]$Path, [string[]]$Names) {
  if (-not (Test-Path $Path)) { return $Names }

  $values = @{}
  foreach ($line in Get-Content $Path) {
    if ($line -match '^\s*([^#][^=]*)=(.*)$') {
      $values[$matches[1].Trim()] = $matches[2].Trim()
    }
  }

  return @($Names | Where-Object {
    $value = [string]$values[$_]
    -not $value -or $value.Contains('<') -or $value.Contains('>')
  })
}

function Write-EnvironmentReadiness {
  $apiEnv = Join-Path $root "apps/api/.env"
  $webEnv = Join-Path $root "apps/web/.env.local"
  $apiMissing = @(Get-MissingEnvironmentNames $apiEnv @("DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY"))
  $webMissing = @(Get-MissingEnvironmentNames $webEnv @(
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ))

  if ($apiMissing.Count -eq 0 -and $webMissing.Count -eq 0) {
    Write-Host "[env] API and identity runtime variables are configured (values hidden)"
    return
  }

  if ($apiMissing.Count -gt 0) {
    Write-Warning "[env] apps/api/.env needs: $($apiMissing -join ', ')"
  }
  if ($webMissing.Count -gt 0) {
    Write-Warning "[env] apps/web/.env.local needs: $($webMissing -join ', ')"
  }
  Write-Warning "[env] Servers can start, but sign-in/dashboard validation is blocked until these local-only values are supplied."
}

Clear-StaleRepoListener 4000 "api"
Clear-StaleRepoListener 3000 "web"
Write-EnvironmentReadiness

if ($PreflightOnly) {
  Write-Host "Dev preflight passed."
  exit 0
}

try {
  Write-Host "[api] starting http://127.0.0.1:4000"
  $apiRoot = Join-Path $root "apps/api"
  $processes += Start-Process -FilePath "node.exe" -ArgumentList @(
    "--env-file-if-exists=.env",
    "--watch",
    "--import",
    "tsx",
    "src/server.ts"
  ) -WorkingDirectory $apiRoot -PassThru -NoNewWindow

  Write-Host "[web] starting http://localhost:3000"
  $webRoot = Join-Path $root "apps/web"
  $next = Join-Path $webRoot "node_modules/.bin/next.cmd"
  if (-not (Test-Path $next)) {
    throw "Web dependencies are missing. Run pnpm install, then retry."
  }
  $processes += Start-Process -FilePath $next -ArgumentList @(
    "dev",
    "--hostname",
    "localhost",
    "--port",
    "3000"
  ) -WorkingDirectory $webRoot -PassThru -NoNewWindow

  Wait-ForEndpoint "api" "http://127.0.0.1:4000/health" $processes
  Wait-ForEndpoint "web" "http://localhost:3000" $processes

  if ($SmokeTest) {
    Write-Host "Dev smoke test passed."
    return
  }

  while ($true) {
    foreach ($process in $processes) {
      $process.Refresh()
      if ($process.HasExited) {
        throw "Dev server process $($process.Id) exited with code $($process.ExitCode)."
      }
    }

    Start-Sleep -Milliseconds 500
  }
}
finally {
  Write-Host "Stopping BOSS dev process trees..."
  foreach ($process in $processes) {
    Stop-ProcessTree $process.Id
  }
}
