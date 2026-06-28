$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$processes = @()

Write-Host "[api] starting @boss/api dev server"
$processes += Start-Process -FilePath "pnpm.cmd" -ArgumentList @("--filter", "@boss/api", "dev") -WorkingDirectory $root -PassThru -NoNewWindow

Write-Host "[web] starting @boss/web dev server"
$processes += Start-Process -FilePath "pnpm.cmd" -ArgumentList @("--filter", "@boss/web", "dev") -WorkingDirectory $root -PassThru -NoNewWindow

try {
  while ($true) {
    foreach ($process in $processes) {
      if ($process.HasExited) {
        throw "Dev server process $($process.Id) exited with code $($process.ExitCode)."
      }
    }

    Start-Sleep -Milliseconds 500
  }
}
finally {
  foreach ($process in $processes) {
    if (-not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }
}
