"use client";

import { useState } from "react";
import { CharityList } from "@/components/charity/charity-list";
import { CreateCampaignModal } from "@/components/charity/create-campaign-modal";
import { Plus, Activity } from "lucide-react";

export default function CharityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 border-l border-r border-slate-900/50 flex-grow">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 tracking-[0.2em] mb-4">
                <Activity size={14} />
                <span>DONATION_LEDGER_ACTIVE</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                Charity Initiatives
            </h1>
        </div>

        <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-emerald-900/20 border border-emerald-500/50 text-emerald-500 px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
        >
            <Plus size={16} />
            Launch Initiative
        </button>
      </div>

      {/* List */}
      <CharityList />

      {/* Modal */}
      {isModalOpen && <CreateCampaignModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}