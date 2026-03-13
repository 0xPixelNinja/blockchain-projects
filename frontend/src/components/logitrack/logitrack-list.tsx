"use client";

import { useState } from "react";
import { useReadContract, useAccount } from "wagmi";
import { LOGITRACK_ABI, LOGITRACK_ADDRESS } from "@/lib/contracts";
import { Package, Search, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterProductModal } from "./register-product-modal";
import { BulkImportModal } from "./bulk-import-modal";

export function LogiTrackList() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const { data: productCount } = useReadContract({
    address: LOGITRACK_ADDRESS,
    abi: LOGITRACK_ABI,
    functionName: "productCount",
  });

  const { data: myProductIds } = useReadContract({
    address: LOGITRACK_ADDRESS,
    abi: LOGITRACK_ABI,
    functionName: "getProductsByRegistrar",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const total = Number(productCount ?? 0);
  const allIds = total > 0
    ? Array.from({ length: total }, (_, i) => 2001 + i)
    : [];
  const displayIds = activeTab === "mine"
    ? (myProductIds ? [...myProductIds].map(Number) : [])
    : allIds;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) return;
    router.push(`/logitrack/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">Global LogiTrack</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Product Tracking</h1>
            <p className="text-slate-500 text-sm font-mono mt-1">
              {total} product{total !== 1 ? "s" : ""} registered on Sepolia
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowBulk(true)}
              className="bg-slate-900 border border-slate-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-orange-500 transition-colors"
            >
              Bulk Import (Excel)
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="bg-orange-600 hover:bg-orange-500 text-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <Plus size={14} />
              Register Product
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="ENTER TRACKING ID (e.g. 2001)"
            className="flex-1 bg-[#050505] border border-slate-800 text-white p-3 text-sm font-mono focus:border-orange-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-500 text-black px-5 py-3 transition-colors"
          >
            <Search size={16} />
          </button>
        </form>

        {isConnected && (
          <div className="flex gap-1 mb-6 border-b border-slate-800 pb-4">
            {(["all", "mine"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeTab === tab
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {tab === "all" ? "All Products" : "My Registered"}
              </button>
            ))}
          </div>
        )}

        {displayIds.length === 0 ? (
          <div className="border border-dashed border-slate-800 p-16 text-center">
            <Package className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-mono text-sm">
              {activeTab === "mine" ? "You have not registered any products yet." : "No products registered yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayIds.map((id) => (
              <ProductCard key={id} id={id} />
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center">
          <a
            href={`https://sepolia.etherscan.io/address/${LOGITRACK_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-orange-400 font-mono transition-colors"
          >
            <ExternalLink size={12} />
            View contract on Etherscan
          </a>
        </div>
      </div>

      {showRegister && <RegisterProductModal onClose={() => setShowRegister(false)} />}
      {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} />}
    </div>
  );
}

function ProductCard({ id }: { id: number }) {
  const { data, isLoading } = useReadContract({
    address: LOGITRACK_ADDRESS,
    abi: LOGITRACK_ABI,
    functionName: "getProduct",
    args: [BigInt(id)],
  });

  const { data: trackingState } = useReadContract({
    address: LOGITRACK_ADDRESS,
    abi: LOGITRACK_ABI,
    functionName: "getTrackingState",
    args: [BigInt(id)],
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

  const [status, location] = trackingState ?? [0, data.origin, BigInt(0)];
  const statusLabel = ["Registered", "In Transit", "Checkpoint", "Delivered", "Delayed", "Cancelled"][Number(status)] ?? "Unknown";
  const statusClass = [
    "border-slate-600 text-slate-300",
    "border-blue-500/40 text-blue-400",
    "border-orange-500/40 text-orange-400",
    "border-green-500/40 text-green-400",
    "border-yellow-500/40 text-yellow-400",
    "border-red-500/40 text-red-400",
  ][Number(status)] ?? "border-slate-600 text-slate-300";

  return (
    <Link href={`/logitrack/${id}`}>
      <div className="border border-slate-800 p-5 hover:border-orange-500/50 transition-colors cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold text-orange-500 tracking-widest font-mono">
            TRACKING_ID #{id}
          </span>
          <Package className="w-4 h-4 text-slate-700 group-hover:text-orange-500 transition-colors" />
        </div>
        <h3 className="text-white font-bold text-sm uppercase tracking-tight mb-1 truncate">
          {data.productName}
        </h3>
        <p className="text-xs text-slate-500 font-mono truncate">Origin: {data.origin}</p>
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest border ${statusClass}`}>
            {statusLabel}
          </span>
          <span className="text-[9px] text-slate-400 font-mono truncate">{String(location)}</span>
        </div>
        <p className="text-[9px] text-slate-700 font-mono mt-2 truncate">CID: {data.qualityDocCID}</p>
      </div>
    </Link>
  );
}
