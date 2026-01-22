"use client";

import { useReadContract } from "wagmi";
import { VOTING_FACTORY_ABI, VOTING_FACTORY_ADDRESS, VOTING_POLL_ABI } from "@/lib/contracts";
import Link from "next/link";
import { Server, ShieldAlert, Globe, Lock } from "lucide-react";
import { useState } from "react";

export function PollList() {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...polls].reverse().map((pollAddress, index) => {
        const displayIndex = polls.length - index; 
        return <PollCard key={pollAddress} address={pollAddress} index={displayIndex} />;
      })}
    </div>
  );
}

function PollCard({ address, index }: { address: `0x${string}`, index: number }) {
    const [hovered, setHovered] = useState(false);

    const { data: title } = useReadContract({
        address,
        abi: VOTING_POLL_ABI,
        functionName: "title",
    });

    const { data: isPublic } = useReadContract({
        address,
        abi: VOTING_POLL_ABI,
        functionName: "isPublic",
    });

    return (
        <Link
            href={`/voting/${address}`}
            className="group relative bg-[#0a0a0f] border-2 border-slate-800 p-6 flex flex-col justify-between h-64 transition-none duration-0 hover:border-cyan-500 cursor-pointer text-left"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-900 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                        <Server size={20} />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold tracking-widest">ID_{String(index).padStart(2, '0')}</span>
                </div>
                
                <h3 className="text-lg font-black text-white mb-2 line-clamp-2 uppercase tracking-tight">
                    {title || "LOADING_PROTOCOL..."}
                </h3>
                
                <div className="text-[10px] font-mono text-slate-500 truncate">
                    {address}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 mt-4">
                <div className="bg-[#0a0a0f] p-2">
                    <div className="text-[9px] text-slate-500 mb-1">ACCESS</div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${isPublic ? 'text-white' : 'text-orange-500'}`}>
                        {isPublic === undefined ? '...' : isPublic ? <><Globe size={10} /> PUBLIC</> : <><Lock size={10} /> PRIVATE</>}
                    </div>
                </div>
                <div className="bg-[#0a0a0f] p-2">
                    <div className="text-[9px] text-slate-500 mb-1">SECURITY</div>
                    <div className="text-xs font-bold text-emerald-500">SECURE</div>
                </div>
            </div>
        </Link>
    )
}
