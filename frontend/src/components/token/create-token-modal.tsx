"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { TOKEN_FACTORY_ABI, TOKEN_FACTORY_ADDRESS } from "@/lib/contracts";
import { X, Loader2 } from "lucide-react";
import { parseUnits } from "viem";

export function CreateTokenModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol || !supply || Number(supply) <= 0) return;

    writeContract({
      address: TOKEN_FACTORY_ADDRESS,
      abi: TOKEN_FACTORY_ABI,
      functionName: "createToken",
      args: [name, symbol, parseUnits(supply, 18)],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0f] border border-slate-700 p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Forge Token</h2>
          <p className="text-xs text-slate-500 font-mono">DEPLOY ERC-20 ON-CHAIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Token Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono"
              placeholder="My Token"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono"
              placeholder="MTK"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Initial Supply
            </label>
            <input
              type="number"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
              min="1"
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono"
              placeholder="1000000"
            />
            <p className="text-[9px] text-slate-600 mt-1 font-mono">TOKENS MINTED TO YOUR WALLET (18 DECIMALS)</p>
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(isPending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Confirming..." : isConfirming ? "Deploying..." : "Deploy Token"}
          </button>
        </form>
      </div>
    </div>
  );
}
