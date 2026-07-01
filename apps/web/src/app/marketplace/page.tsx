"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../lib/apiClient";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Packs",
  general: "General",
  field_service: "Field Service",
  healthcare: "Healthcare",
  food_service: "Food & Beverage",
  retail: "Retail",
  professional_services: "Professional Services",
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

const CATEGORY_ICONS: Record<string, string> = {
  general: "⚙️",
  field_service: "🔧",
  healthcare: "🏥",
  food_service: "🍽️",
  retail: "🛍️",
  professional_services: "💼",
};

export default function MarketplacePage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [installing, setInstalling] = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [allPacks, installedPacks] = await Promise.all([
          apiClient.getMarketplacePacks(DEMO_ORG_ID),
          apiClient.getInstalledPacks(DEMO_ORG_ID),
        ]);
        setPacks(allPacks);
        setInstalled(new Set(installedPacks.map((p: InstalledPack) => p.packKey)));
      } catch {
        setError("Failed to load marketplace.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

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
    try {
      await apiClient.installPack(DEMO_ORG_ID, packKey);
      setInstalled((prev) => new Set([...prev, packKey]));
      setSuccessMsg(`Pack installed successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError(`Failed to install pack.`);
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Industry Pack Marketplace
          </h1>
          <p className="mt-2 text-gray-400 text-lg">
            Extend BOSS with industry-specific KPIs, workflows, and AI employees. Zero platform changes. Install in seconds.
          </p>

          {/* Search */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search packs by name, industry, or capability..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-xl bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-10">
        {/* Success message */}
        {successMsg && (
          <div className="bg-green-900/40 border border-green-600 rounded-lg px-4 py-3 text-green-400 text-sm">
            {successMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-600 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Installed indicator */}
        {installed.size > 0 && (
          <div className="text-sm text-gray-500">
            {installed.size} pack{installed.size !== 1 ? "s" : ""} installed for this organization
          </div>
        )}

        {/* Featured Packs */}
        {featuredPacks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Featured Packs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPacks.map((pack) => (
                <PackCard
                  key={pack.key}
                  pack={pack}
                  isInstalled={installed.has(pack.key)}
                  isInstalling={installing.has(pack.key)}
                  onInstall={handleInstall}
                />
              ))}
            </div>
          </section>
        )}

        {/* Other Available Packs */}
        {availablePacks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Available Packs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePacks.map((pack) => (
                <PackCard
                  key={pack.key}
                  pack={pack}
                  isInstalled={installed.has(pack.key)}
                  isInstalling={installing.has(pack.key)}
                  onInstall={handleInstall}
                />
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon */}
        {comingSoonPacks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoonPacks.map((pack) => (
                <PackCard
                  key={pack.key}
                  pack={pack}
                  isInstalled={false}
                  isInstalling={false}
                  onInstall={handleInstall}
                />
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

function PackCard({
  pack,
  isInstalled,
  isInstalling,
  onInstall,
}: {
  pack: Pack;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: (key: string) => void;
}) {
  const icon = CATEGORY_ICONS[pack.category] ?? "📦";

  return (
    <div
      className={`bg-gray-900 border rounded-xl p-6 flex flex-col gap-4 transition-colors ${
        isInstalled ? "border-green-700/50" : "border-gray-800 hover:border-gray-700"
      } ${pack.comingSoon ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl">{icon}</span>
          <h3 className="mt-2 text-base font-semibold text-white">{pack.name}</h3>
          <span className="text-xs text-gray-500">v{pack.version}</span>
        </div>
        {isInstalled && (
          <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/50 px-2 py-1 rounded-full">
            Installed
          </span>
        )}
        {pack.comingSoon && (
          <span className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-1 rounded-full">
            Coming Soon
          </span>
        )}
      </div>

      <p className="text-sm text-gray-400 leading-relaxed flex-1">{pack.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-gray-800 rounded-lg py-2">
          <div className="font-semibold text-white">{pack.kpiCount}</div>
          <div className="text-gray-500">KPIs</div>
        </div>
        <div className="bg-gray-800 rounded-lg py-2">
          <div className="font-semibold text-white">{pack.workflowCount}</div>
          <div className="text-gray-500">Workflows</div>
        </div>
        <div className="bg-gray-800 rounded-lg py-2">
          <div className="font-semibold text-white">{pack.aiEmployeeCount}</div>
          <div className="text-gray-500">AI Employees</div>
        </div>
      </div>

      {/* Industries */}
      <div className="flex flex-wrap gap-1">
        {pack.industries.slice(0, 4).map((industry) => (
          <span key={industry} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {industry.replace(/_/g, " ")}
          </span>
        ))}
        {pack.industries.length > 4 && (
          <span className="text-xs text-gray-600">+{pack.industries.length - 4} more</span>
        )}
      </div>

      {/* Action */}
      {!pack.comingSoon && (
        <button
          onClick={() => onInstall(pack.key)}
          disabled={isInstalled || isInstalling}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            isInstalled
              ? "bg-gray-800 text-gray-500 cursor-default"
              : isInstalling
              ? "bg-gray-700 text-gray-400 cursor-wait"
              : "bg-red-600 hover:bg-red-500 text-white cursor-pointer"
          }`}
        >
          {isInstalled ? "Installed" : isInstalling ? "Installing..." : "Install Pack"}
        </button>
      )}
    </div>
  );
}
