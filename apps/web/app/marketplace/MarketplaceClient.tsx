"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../src/lib/apiClient";
import { useFeatureRuntime } from "../../src/lib/featureRuntime";
import type { FeatureRuntimeError } from "../../src/lib/featureRuntime";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Packs",
  general: "General",
  field_service: "Field Service",
  healthcare: "Healthcare",
  food_service: "Food & Beverage",
  retail: "Retail",
  professional_services: "Professional Services",
};

const CATEGORY_ICONS: Record<string, string> = {
  general: "⚙️",
  field_service: "🔧",
  healthcare: "🏥",
  food_service: "🍽️",
  retail: "🛍️",
  professional_services: "💼",
};

interface Pack {
  key: string;
  name: string;
  description: string;
  version: string;
  category: string;
  industries: string[];
  kpiCount: number;
  workflowCount: number;
  aiEmployeeCount: number;
  decisionCount: number;
  constraintCount: number;
  playbookCount: number;
  featured: boolean;
  comingSoon: boolean;
}

interface InstalledPack {
  packKey: string;
  installedAt: string;
  version: string;
}

interface MarketplaceData {
  packs: Pack[];
  installed: Set<string>;
}

export function MarketplaceClient({ orgId }: { orgId: string }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [installing, setInstalling] = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const loader = useCallback(async () => {
    let packsResult: Pack[] | null = null;
    let installedResult: InstalledPack[] | null = null;

    // Fetch catalog first — separate try/catch for per-dependency error attribution
    try {
      packsResult = await apiClient.getMarketplacePacks(orgId);
    } catch (err) {
      // Re-throw with dependency context so classifyError gets the right label
      const e = err as Error;
      e.message = `[Industry Pack Catalog] ${e.message}`;
      throw err;
    }

    try {
      installedResult = await apiClient.getInstalledPacks(orgId);
    } catch (err) {
      const e = err as Error;
      e.message = `[Installed Packs] ${e.message}`;
      throw err;
    }

    return {
      data: {
        packs: packsResult,
        installed: new Set(installedResult.map((p) => p.packKey)),
      } satisfies MarketplaceData,
      dependencies: [
        { name: "Industry Pack Catalog", status: "healthy" as const },
        { name: "Installed Packs", status: "healthy" as const },
      ],
    };
  }, [orgId]);

  const [runtimeState, { load, retry, setData }] = useFeatureRuntime<MarketplaceData>(
    "Marketplace",
    loader,
  );

  useEffect(() => {
    void load();
  }, [load]);

  const packs = runtimeState.data?.packs ?? [];
  const installed = runtimeState.data?.installed ?? new Set<string>();
  const loading = runtimeState.status === "idle" || runtimeState.status === "loading";

  const filteredPacks = packs.filter((pack) => {
    const matchesCategory = selectedCategory === "all" || pack.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      pack.name.toLowerCase().includes(q) ||
      pack.description.toLowerCase().includes(q) ||
      pack.industries.some((i) => i.includes(q));
    return matchesCategory && matchesSearch;
  });

  const featuredPacks = filteredPacks.filter((p) => p.featured && !p.comingSoon);
  const availablePacks = filteredPacks.filter((p) => !p.featured && !p.comingSoon);
  const comingSoonPacks = filteredPacks.filter((p) => p.comingSoon);

  async function handleInstall(packKey: string) {
    setInstalling((prev) => new Set([...prev, packKey]));
    setInstallError(null);
    try {
      await apiClient.installPack(orgId, packKey);
      setData({
        packs,
        installed: new Set([...installed, packKey]),
      });
      setSuccessMsg("Pack installed successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setInstallError(`Failed to install pack. Please try again.`);
    } finally {
      setInstalling((prev) => {
        const next = new Set(prev);
        next.delete(packKey);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (runtimeState.status === "error" && runtimeState.error) {
    return <MarketplaceError error={runtimeState.error} onRetry={retry} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Industry Pack Marketplace
          </h1>
          <p className="mt-2 text-gray-400 text-lg">
            Extend BOSS with industry-specific KPIs, workflows, and AI employees. Zero platform changes. Install in seconds.
          </p>
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search packs by name, industry, or capability..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-xl bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === key ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-10">
        {successMsg && (
          <div className="bg-green-900/40 border border-green-600 rounded-lg px-4 py-3 text-green-400 text-sm">{successMsg}</div>
        )}
        {installError && (
          <div className="bg-red-900/40 border border-red-600 rounded-lg px-4 py-3 text-red-400 text-sm">{installError}</div>
        )}
        {installed.size > 0 && (
          <div className="text-sm text-gray-500">{installed.size} pack{installed.size !== 1 ? "s" : ""} installed for this organization</div>
        )}

        {featuredPacks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Featured Packs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPacks.map((pack) => (
                <PackCard key={pack.key} pack={pack} isInstalled={installed.has(pack.key)} isInstalling={installing.has(pack.key)} onInstall={handleInstall} />
              ))}
            </div>
          </section>
        )}

        {availablePacks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Available Packs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePacks.map((pack) => (
                <PackCard key={pack.key} pack={pack} isInstalled={installed.has(pack.key)} isInstalling={installing.has(pack.key)} onInstall={handleInstall} />
              ))}
            </div>
          </section>
        )}

        {comingSoonPacks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoonPacks.map((pack) => (
                <PackCard key={pack.key} pack={pack} isInstalled={false} isInstalling={false} onInstall={handleInstall} />
              ))}
            </div>
          </section>
        )}

        {filteredPacks.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No packs match your search.</p>
            <button
              className="mt-4 text-red-400 hover:text-red-300 text-sm"
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketplaceError({ error, onRetry }: { error: FeatureRuntimeError; onRetry: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-gray-900 border border-red-900/50 rounded-2xl p-8 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Marketplace temporarily unavailable
          </h2>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed">{error.message}</p>

        <div className="bg-gray-950 rounded-xl p-4 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">Error Code</span>
            <span className="text-red-400">{error.code}</span>
          </div>
          {error.httpStatus && (
            <div className="flex justify-between">
              <span className="text-gray-500">HTTP Status</span>
              <span className="text-gray-300">{error.httpStatus}</span>
            </div>
          )}
          {error.dependency && (
            <div className="flex justify-between">
              <span className="text-gray-500">Dependency</span>
              <span className="text-gray-300">{error.dependency}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Correlation ID</span>
            <span className="text-gray-400 select-all">{error.correlationId}</span>
          </div>
          {error.traceId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Trace ID</span>
              <span className="text-gray-400 select-all">{error.traceId}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {error.retryable && (
            <button
              onClick={onRetry}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="px-4 py-2.5 text-sm text-gray-400 border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            {showDetails ? "Hide Details" : "View Details"}
          </button>
        </div>

        {showDetails && (
          <div className="bg-gray-950 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p>Dependency chain: Session → Organization → {error.dependency ?? "Marketplace"}</p>
            <p>Retryable: {error.retryable ? "Yes" : "No — please contact support"}</p>
            <p>Timestamp: {new Date().toISOString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PackCard({
  pack, isInstalled, isInstalling, onInstall,
}: {
  pack: Pack;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: (key: string) => void;
}) {
  const icon = CATEGORY_ICONS[pack.category] ?? "📦";
  return (
    <div className={`bg-gray-900 border rounded-xl p-6 flex flex-col gap-4 transition-colors ${isInstalled ? "border-green-700/50" : "border-gray-800 hover:border-gray-700"} ${pack.comingSoon ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl">{icon}</span>
          <h3 className="mt-2 text-base font-semibold text-white">{pack.name}</h3>
          <span className="text-xs text-gray-500">v{pack.version}</span>
        </div>
        {isInstalled && <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/50 px-2 py-1 rounded-full">Installed</span>}
        {pack.comingSoon && <span className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-1 rounded-full">Coming Soon</span>}
      </div>
      <p className="text-sm text-gray-400 leading-relaxed flex-1">{pack.description}</p>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-gray-800 rounded-lg py-2"><div className="font-semibold text-white">{pack.kpiCount}</div><div className="text-gray-500">KPIs</div></div>
        <div className="bg-gray-800 rounded-lg py-2"><div className="font-semibold text-white">{pack.workflowCount}</div><div className="text-gray-500">Workflows</div></div>
        <div className="bg-gray-800 rounded-lg py-2"><div className="font-semibold text-white">{pack.aiEmployeeCount}</div><div className="text-gray-500">AI Employees</div></div>
      </div>
      <div className="flex flex-wrap gap-1">
        {pack.industries.slice(0, 4).map((industry) => (
          <span key={industry} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{industry.replace(/_/g, " ")}</span>
        ))}
        {pack.industries.length > 4 && <span className="text-xs text-gray-600">+{pack.industries.length - 4} more</span>}
      </div>
      {!pack.comingSoon && (
        <button
          onClick={() => onInstall(pack.key)}
          disabled={isInstalled || isInstalling}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${isInstalled ? "bg-gray-800 text-gray-500 cursor-default" : isInstalling ? "bg-gray-700 text-gray-400 cursor-wait" : "bg-red-600 hover:bg-red-500 text-white cursor-pointer"}`}
        >
          {isInstalled ? "Installed" : isInstalling ? "Installing..." : "Install Pack"}
        </button>
      )}
    </div>
  );
}
