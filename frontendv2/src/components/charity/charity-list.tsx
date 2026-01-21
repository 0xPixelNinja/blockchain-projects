"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHARITY_ABI, CHARITY_ADDRESS } from "@/lib/contracts";
import { useState } from "react";
import { Loader2, Heart, Search } from "lucide-react";
import Link from "next/link";
import { formatEther } from "viem";

export function CharityList() {
    // Read total campaign count
    const { data: campaignCount, isLoading } = useReadContract({
        address: CHARITY_ADDRESS,
        abi: CHARITY_ABI,
        functionName: "campaignCount",
    });

    if (isLoading) {
        return <div className="animate-pulse text-xs font-mono text-slate-500">SCANNING_LEDGER...</div>;
    }

    if (!campaignCount || Number(campaignCount) === 0) {
        return <div className="text-slate-500 font-mono text-xs">NO_ACTIVE_INITIATIVES_FOUND</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 
              In a real app, we'd use a subgraph or multicall.
              Here we create an array of IDs and render a component for each to fetch its details.
              Reverse to show newest first.
            */}
            {Array.from({ length: Number(campaignCount) }, (_, i) => Number(campaignCount) - i).map(id => (
                <CampaignCard key={id} id={id} />
            ))}
        </div>
    );
}

function CampaignCard({ id }: { id: number }) {
    const { data: campaign } = useReadContract({
        address: CHARITY_ADDRESS,
        abi: CHARITY_ABI,
        functionName: "getCampaign",
        args: [BigInt(id)],
    });

    if (!campaign) return <div className="h-48 bg-[#0a0a0f] animate-pulse border border-slate-800" />;

    return (
        <Link 
            href={`/charity/${id}`}
            className="group block bg-[#0a0a0f] border-2 border-slate-800 p-6 hover:border-emerald-500 transition-none duration-0 cursor-pointer h-full flex flex-col justify-between"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-900 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                        <Heart size={20} />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold tracking-widest">CAMPAIGN_{String(id).padStart(3, '0')}</span>
                </div>

                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight line-clamp-2">{campaign.name}</h3>
                
                <div className="text-xs font-mono text-slate-400 mb-4 break-all">
                    {campaign.charityAddress.slice(0, 6)}...{campaign.charityAddress.slice(-4)}
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-3 mt-4">
                 <div className="text-[9px] text-slate-500 mb-1 tracking-widest">TOTAL_RAISED</div>
                 <div className="text-lg font-bold text-white flex items-baseline gap-1">
                    {formatEther(campaign.totalDonated)} <span className="text-xs text-emerald-500">ETH</span>
                 </div>
            </div>
        </Link>
    );
}
