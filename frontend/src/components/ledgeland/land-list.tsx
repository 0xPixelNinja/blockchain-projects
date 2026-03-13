"use client";

import { useState } from "react";
import { useReadContract, useAccount } from "wagmi";
import { LAND_REGISTRY_ABI, LAND_REGISTRY_ADDRESS } from "@/lib/contracts";
import { Landmark, Search, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterLandModal } from "./register-land-modal";
import { BulkImportModal } from "./bulk-import-modal";

export function LandList() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const { data: landCount } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "landCount",
  });

  const { data: myLandIds } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "getLandsByOwner",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: registrar } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "registrar",
  });

  const total = Number(landCount ?? 0);
  const isRegistrar = isConnected && typeof registrar === "string" && typeof address === "string" && registrar.toLowerCase() === address.toLowerCase();
  const myIds = myLandIds ? [...myLandIds].map(Number) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) return;
    router.push(`/ledgeland/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Landmark className="w-6 h-6 text-rose-500" />
              <span className="text-[10px] font-bold text-rose-500 tracking-widest uppercase">LedgeLand Registry</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Land Records</h1>
            <p className="text-slate-500 text-sm font-mono mt-1">
              {total} record{total !== 1 ? "s" : ""} on Sepolia ledger
            </p>
          </div>

          {isRegistrar && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulk(true)}
                className="bg-slate-900 border border-slate-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-rose-500 transition-colors"
              >
                Bulk Import (Excel)
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Plus size={14} />
                Register Land
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="ENTER LAND ID (e.g. 8801)"
            className="flex-1 bg-[#050505] border border-slate-800 text-white p-3 text-sm font-mono focus:border-rose-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-3 transition-colors"
          >
            <Search size={16} />
          </button>
        </form>

        {isConnected && myIds.length > 0 && (
          <div className="flex gap-1 mb-6 border-b border-slate-800 pb-4">
            {(["all", "mine"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeTab === tab
                    ? "text-rose-500 border-b-2 border-rose-500"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {tab === "all" ? "All Records" : "My Properties"}
              </button>
            ))}
          </div>
        )}

        {activeTab === "mine" && myIds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myIds.map((id) => (
              <LandCard key={id} landId={id} />
            ))}
          </div>
        ) : activeTab === "all" && total > 0 ? (
          <AllLandsNotice total={total} />
        ) : (
          <div className="border border-dashed border-slate-800 p-16 text-center">
            <Landmark className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-mono text-sm">
              {activeTab === "mine" ? "You do not own any registered land." : "No land records registered yet."}
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center">
          <a
            href={`https://sepolia.etherscan.io/address/${LAND_REGISTRY_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-rose-400 font-mono transition-colors"
          >
            <ExternalLink size={12} />
            View contract on Etherscan
          </a>
        </div>
      </div>

      {showRegister && <RegisterLandModal onClose={() => setShowRegister(false)} />}
      {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} />}
    </div>
  );
}

function AllLandsNotice({ total }: { total: number }) {
  return (
    <div className="border border-slate-800 p-8 text-center">
      <Landmark className="w-8 h-8 text-rose-500/30 mx-auto mb-4" />
      <p className="text-slate-400 font-mono text-sm mb-2">
        {total} land record{total !== 1 ? "s" : ""} registered on-chain.
      </p>
      <p className="text-slate-600 font-mono text-xs">
        Use the search bar above to look up a specific Land ID.
      </p>
    </div>
  );
}

function LandCard({ landId }: { landId: number }) {
  const { data, isLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "getLand",
    args: [BigInt(landId)],
  });

  if (isLoading) {
    return (
      <div className="border border-slate-800 p-5 animate-pulse">
        <div className="h-3 bg-slate-800 rounded w-1/3 mb-3" />
        <div className="h-4 bg-slate-800 rounded w-2/3 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <Link href={`/ledgeland/${landId}`}>
      <div className="border border-slate-800 p-5 hover:border-rose-500/50 transition-colors cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold text-rose-500 tracking-widest font-mono">
            LAND_ID #{landId}
          </span>
          <Landmark className="w-4 h-4 text-slate-700 group-hover:text-rose-500 transition-colors" />
        </div>
        <h3 className="text-white font-bold text-sm uppercase tracking-tight mb-1 truncate">
          {data.location}
        </h3>
        <p className="text-xs text-slate-500 font-mono truncate">
          Owner: {data.currentOwner.slice(0, 6)}...{data.currentOwner.slice(-4)}
        </p>
        <p className="text-[9px] text-slate-700 font-mono mt-2 truncate">Deed: {data.deedCID}</p>
      </div>
    </Link>
  );
}
