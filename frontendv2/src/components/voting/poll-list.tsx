"use client";

import { useReadContract } from "wagmi";
import { VOTING_FACTORY_ABI, VOTING_FACTORY_ADDRESS } from "@/lib/contracts";
import Link from "next/link";
import { Server, ShieldAlert, Globe, Lock } from "lucide-react";
import { useState } from "react";

export function PollList() {
  const [hoveredPoll, setHoveredPoll] = useState<string | null>(null);

  const { data: polls, isLoading } = useReadContract({
    address: VOTING_FACTORY_ADDRESS,
    abi: VOTING_FACTORY_ABI,
    functionName: "getDeployedPolls",
  });

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => (
                <div key={i} className="h-48 bg-[#0a0a0f] border border-slate-800" />
            ))}
        </div>
    )
  }

  if (!polls || polls.length === 0) {
    return (
        <div className="w-full p-12 border border-slate-800 bg-[#0a0a0f] flex flex-col items-center justify-center text-slate-500">
            <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-mono text-sm tracking-widest">NO_PROTOCOLS_FOUND</p>
        </div>
    )
  }

  // Contract returns array of addresses. We need to fetch details for each ideally, 
  // but for listing we might just list addresses first or fetch rudimentary details.
  // The factory event (PollCreated) has the title/isPublic, but reading logs is heavier.
  // For V1, let's just list the instances and link to them.
  // Or better, let's assume we can display the address as the "ID".

  // NOTE: For a real production app, we would index `PollCreated` events to get titles.
  // Since we don't have a subgraph, we will just list the addresses and let the detail page fetching handle the rest.
  // Optimization: We could use a multicall to fetch titles for all polls here, but let's keep it simple for M1.

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...polls].reverse().map((pollAddress, index) => {
        const displayIndex = polls.length - index; // Sequential number
        return (
            <Link
              href={`/voting/${pollAddress}`}
              key={pollAddress}
              className={`
                group relative bg-[#0a0a0f] border-2 border-slate-800 p-6 flex flex-col justify-between h-64
                transition-none duration-0 hover:border-cyan-500 cursor-pointer text-left
              `}
              onMouseEnter={() => setHoveredPoll(pollAddress)}
              onMouseLeave={() => setHoveredPoll(null)}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-900 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                        <Server size={20} />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold tracking-widest">ID_{String(displayIndex).padStart(2, '0')}</span>
                </div>
                
                <h3 className="text-lg font-mono text-white mb-2 truncate" title={pollAddress}>
                    {pollAddress}
                </h3>
                
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-1 py-0.5 bg-slate-900 text-cyan-500">
                        ACTIVE
                    </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 mt-4">
                <div className="bg-[#0a0a0f] p-2">
                  <div className="text-[9px] text-slate-500 mb-1">TYPE</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                     <Globe size={10} /> PUBLIC
                  </div>
                </div>
                <div className="bg-[#0a0a0f] p-2">
                  <div className="text-[9px] text-slate-500 mb-1">SECURITY</div>
                  <div className="text-xs font-bold text-emerald-500">SECURE</div>
                </div>
              </div>
            </Link>
        );
      })}
    </div>
  );
}
