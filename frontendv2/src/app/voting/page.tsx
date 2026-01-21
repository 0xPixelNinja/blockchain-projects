"use client";

import { useState } from "react";
import { PollList } from "@/components/voting/poll-list";
import { CreatePollModal } from "@/components/voting/create-poll-modal";
import { Plus, Terminal } from "lucide-react";

export default function VotingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 border-l border-r border-slate-900/50 flex-grow">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-600 tracking-[0.2em] mb-4">
                <Terminal size={14} />
                <span>GOVERNANCE_MODULE_ACTIVE</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                Voting Protocols
            </h1>
        </div>

        <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-cyan-900/20 border border-cyan-500/50 text-cyan-500 px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-cyan-500 hover:text-black transition-all cursor-pointer"
        >
            <Plus size={16} />
            Initialize Protocol
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-px bg-slate-900 mb-12 border border-slate-800 overflow-x-auto">
        <div className="flex-1 min-w-[150px] p-4 bg-[#0a0a0f]">
            <div className="text-[10px] text-slate-500 tracking-widest mb-1">NETWORK_STATUS</div>
            <div className="text-emerald-500 font-bold text-sm">OPERATIONAL</div>
        </div>
        <div className="flex-1 min-w-[150px] p-4 bg-[#0a0a0f]">
             <div className="text-[10px] text-slate-500 tracking-widest mb-1">CONSENSUS</div>
             <div className="text-white font-bold text-sm">PoS (SEPOLIA)</div>
        </div>
        <div className="flex-1 min-w-[150px] p-4 bg-[#0a0a0f]">
             <div className="text-[10px] text-slate-500 tracking-widest mb-1">GAS_PRICE</div>
             <div className="text-white font-bold text-sm">~15 GWEI</div>
        </div>
      </div>

      {/* List */}
      <PollList />

      {/* Modal */}
      {isModalOpen && <CreatePollModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}