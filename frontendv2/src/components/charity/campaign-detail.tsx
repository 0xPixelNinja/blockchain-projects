"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CHARITY_ABI, CHARITY_ADDRESS } from "@/lib/contracts";
import { useState } from "react";
import { Loader2, Heart, Download, Wallet, ArrowRight, History, ShieldCheck } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { useRouter } from "next/navigation";

export function CampaignDetail({ id }: { id: number }) {
  const { address: userAddress } = useAccount();
  const router = useRouter();
  const [donationAmount, setDonationAmount] = useState("");

  // 1. Read Campaign Data
  const { data: campaign, refetch: refetchCampaign } = useReadContract({
    address: CHARITY_ADDRESS,
    abi: CHARITY_ABI,
    functionName: "getCampaign",
    args: [BigInt(id)],
  });

  const { data: donationCount } = useReadContract({
    address: CHARITY_ADDRESS,
    abi: CHARITY_ABI,
    functionName: "getCampaignDonationCount",
    args: [BigInt(id)],
  });

  // 2. Write Hooks
  const { data: donateHash, writeContract: donate, isPending: isDonating } = useWriteContract();
  const { isLoading: isDonateConfirming, isSuccess: isDonateSuccess } = useWaitForTransactionReceipt({ hash: donateHash });

  const { data: withdrawHash, writeContract: withdraw, isPending: isWithdrawing } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount) return;
    donate({
        address: CHARITY_ADDRESS,
        abi: CHARITY_ABI,
        functionName: "donate",
        args: [BigInt(id)],
        value: parseEther(donationAmount),
    });
  };

  const handleWithdraw = () => {
    withdraw({
        address: CHARITY_ADDRESS,
        abi: CHARITY_ABI,
        functionName: "withdrawFunds",
        args: [BigInt(id)],
    });
  };

  const isInteractionPending = isDonating || isDonateConfirming || isWithdrawing || isWithdrawConfirming;
  const isCharityOwner = userAddress && campaign && userAddress.toLowerCase() === campaign.charityAddress.toLowerCase();

  if (isDonateSuccess || isWithdrawSuccess) {
     refetchCampaign();
     router.refresh();
  }

  if (!campaign) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
            <div className="h-64 bg-[#0a0a0f] border border-slate-800" />
            <div className="lg:col-span-2 h-64 bg-[#0a0a0f] border border-slate-800" />
        </div>
      )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: STATUS & ACTION */}
        <div className="space-y-6">
            <div className="bg-[#0a0a0f] border-2 border-slate-800 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Heart size={120} className="text-emerald-500" />
                </div>

                <div className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">TARGET_INITIATIVE</div>
                <h1 className="text-3xl font-black text-white uppercase break-words mb-2 leading-tight relative z-10">{campaign.name}</h1>
                <div className="text-xs font-mono text-slate-400 mb-8 z-10 relative">
                    ID: #{id}
                </div>

                <div className="mb-8">
                    <div className="text-[10px] text-emerald-500 font-bold tracking-widest mb-1">TOTAL_VOLUME</div>
                    <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                        {formatEther(campaign.totalDonated)} <span className="text-sm text-emerald-600">ETH</span>
                    </div>
                </div>

                {campaign.active ? (
                    <form onSubmit={handleDonate} className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Transmit Liquidity (ETH)
                            </label>
                            <input 
                                type="number" 
                                step="any"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                                placeholder="0.00"
                                disabled={isInteractionPending}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isInteractionPending || !donationAmount}
                            className="w-full bg-emerald-600 text-black font-black py-4 text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {(isInteractionPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                            CONFIRM_TRANSMISSION
                        </button>
                    </form>
                ) : (
                    <div className="bg-slate-900/50 border border-slate-800 p-4 text-center text-xs font-bold text-slate-500 uppercase">
                        INITIATIVE_CLOSED
                    </div>
                )}
            </div>

            {isCharityOwner && (
                <div className="bg-slate-900/20 border border-emerald-900/30 p-6 border-dashed">
                    <div className="text-[10px] text-emerald-500 font-bold tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck size={12} /> AUTHENTICATED_BENEFICIARY
                    </div>
                    <button 
                        onClick={handleWithdraw}
                        disabled={isInteractionPending || campaign.totalDonated === BigInt(0)}
                        className="w-full bg-emerald-900/30 text-emerald-500 border border-emerald-500/50 p-4 text-xs font-bold uppercase hover:bg-emerald-500 hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={14} /> 
                        Extract Liquidity
                    </button>
                    <div className="mt-2 text-[10px] text-slate-600 font-mono text-center">
                        Wallet: {campaign.charityAddress.slice(0, 6)}...{campaign.charityAddress.slice(-4)}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: LEDGER */}
        <div className="lg:col-span-2">
            <div className="bg-[#0a0a0f] border-t-2 border-b-2 border-slate-800 min-h-[500px] flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                    <span className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                        <History size={14} /> TRANSACTION_LEDGER
                    </span>
                    <span className="text-[10px] text-slate-500">COUNT: {donationCount?.toString() || '0'}</span>
                </div>
                
                <div className="flex-grow p-0 overflow-y-auto max-h-[600px]">
                    {/* Donation List */}
                    {donationCount && Number(donationCount) > 0 ? (
                        <DonationList 
                           campaignId={id} 
                           count={Number(donationCount)} 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                             <Wallet className="w-8 h-8 mb-2 opacity-50" />
                             <span className="text-xs font-mono">NO_TRANSACTIONS_LOGGED</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

function DonationList({ campaignId, count }: { campaignId: number, count: number }) {
    // Show latest 10 donations. Reverse index logic: count-1, count-2...
    const indices = Array.from({ length: Math.min(count, 10) }, (_, i) => count - 1 - i);

    return (
        <div className="divide-y divide-slate-800/50">
            {indices.map(index => (
                <DonationRow key={index} campaignId={campaignId} index={index} />
            ))}
        </div>
    )
}

function DonationRow({ campaignId, index }: { campaignId: number, index: number }) {
    const { data: donation } = useReadContract({
        address: CHARITY_ADDRESS,
        abi: CHARITY_ABI,
        functionName: "getCampaignDonation",
        args: [BigInt(campaignId), BigInt(index)]
    });

    if (!donation) return <div className="h-12 bg-slate-900/30 animate-pulse m-2" />;

    return (
        <div className="p-4 hover:bg-slate-900/30 transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                    #{index + 1}
                </div>
                <div>
                   <div className="text-xs text-emerald-400 font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse"></span>
                      INCOMING_TX
                   </div>
                   <div className="text-[10px] text-slate-500 font-mono">
                      FROM: {donation.donor}
                   </div>
                </div>
            </div>
            
            <div className="text-right">
                <div className="text-sm font-bold text-white font-mono">
                    {formatEther(donation.amount)} ETH
                </div>
                <div className="text-[9px] text-slate-600 uppercase tracking-widest">
                    {new Date(Number(donation.timestamp) * 1000).toLocaleString()}
                </div>
            </div>
        </div>
    )
}
