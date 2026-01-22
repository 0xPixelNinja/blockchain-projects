"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CHARITY_ABI, CHARITY_ADDRESS } from "@/lib/contracts";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";

export function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const [name, setName] = useState("");
  const [charityAddress, setCharityAddress] = useState("");
  const router = useRouter();

  // Auto-fill beneficiary address if wallet is connected
  useEffect(() => {
    if (address && !charityAddress) {
      setCharityAddress(address);
    }
  }, [address, charityAddress]);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !isAddress(charityAddress)) return;

    writeContract({
        address: CHARITY_ADDRESS,
        abi: CHARITY_ABI,
        functionName: "createCampaign",
        args: [name, charityAddress],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      onClose();
      router.refresh();
    }
  }, [isSuccess, onClose, router]);

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
            <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Launch Initiative</h2>
            <p className="text-xs text-slate-500 font-mono">REGISTER CAMPAIGN ON LEDGER</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Campaign Name
                </label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                    placeholder="ENTER_NAME"
                />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Beneficiary Wallet (Address)
                </label>
                <input 
                    type="text" 
                    value={charityAddress}
                    onChange={(e) => setCharityAddress(e.target.value)}
                    className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                    placeholder="0x..."
                />
            </div>

            <button
                type="submit"
                disabled={isPending || isConfirming}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {(isPending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Confirming..." : isConfirming ? "Registering..." : "Execute Registration"}
            </button>
        </form>
      </div>
    </div>
  );
}
