"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VOTING_FACTORY_ABI, VOTING_FACTORY_ADDRESS } from "@/lib/contracts";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreatePollModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const router = useRouter();

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    writeContract({
      address: VOTING_FACTORY_ADDRESS,
      abi: VOTING_FACTORY_ABI,
      functionName: "createPoll",
      args: [title, isPublic],
    });
  };

  if (isSuccess) {
    onClose();
    router.refresh(); 
  }

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
            <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Initialize Protocol</h2>
            <p className="text-xs text-slate-500 font-mono">DEPLOY NEW VOTING CONTRACT INSTANCE</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Protocol Title
                </label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-cyan-500 focus:outline-none transition-colors font-mono"
                    placeholder="ENTER_TITLE"
                />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Access Level
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setIsPublic(true)}
                        className={`p-3 text-xs font-bold border ${isPublic ? 'bg-emerald-950 border-emerald-500 text-emerald-500' : 'bg-[#050505] border-slate-800 text-slate-500 hover:border-slate-600'}`}
                    >
                        PUBLIC
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className={`p-3 text-xs font-bold border ${!isPublic ? 'bg-orange-950 border-orange-500 text-orange-500' : 'bg-[#050505] border-slate-800 text-slate-500 hover:border-slate-600'}`}
                    >
                        WHITELIST
                    </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending || isConfirming}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {(isPending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Confirming..." : isConfirming ? "Deploying..." : "Execute Deployment"}
            </button>
        </form>
      </div>
    </div>
  );
}
