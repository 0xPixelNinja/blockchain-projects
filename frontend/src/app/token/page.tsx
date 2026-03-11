"use client";

import { useState } from "react";
import { TokenList } from "@/components/token/token-list";
import { CreateTokenModal } from "@/components/token/create-token-modal";
import { Plus, Coins } from "lucide-react";
import { useReadContract } from "wagmi";
import { TOKEN_FACTORY_ABI, TOKEN_FACTORY_ADDRESS } from "@/lib/contracts";

export default function TokenPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tokenCount } = useReadContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TOKEN_FACTORY_ABI,
    functionName: "getDeployedTokenCount",
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 border-l border-r border-slate-900/50 grow">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 tracking-[0.2em] mb-4">
            <Coins size={14} />
            <span>TOKEN_FORGE_ACTIVE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
            Token Factory
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-amber-900/20 border border-amber-500/50 text-amber-500 px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
        >
          <Plus size={16} />
          Create Token
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-8 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">TOKENS_DEPLOYED:</span>
          <span className="text-amber-500 font-bold">
            {tokenCount !== undefined ? Number(tokenCount) : "..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">STANDARD:</span>
          <span className="text-white">ERC-20</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">NETWORK:</span>
          <span className="text-white">SEPOLIA</span>
        </div>
      </div>

      {/* List */}
      <TokenList />

      {/* Modal */}
      {isModalOpen && <CreateTokenModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
