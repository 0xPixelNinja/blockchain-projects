"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { VOTING_POLL_ABI } from "@/lib/contracts";
import { useState, useMemo } from "react";
import { Loader2, CheckCircle2, User, Trophy, Play, Square, Timer } from "lucide-react";
import { useRouter } from "next/navigation";

export function PollDetail({ address }: { address: `0x${string}` }) {
  const { address: userAddress } = useAccount();
  const router = useRouter();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  // 1. Read Core Poll Data
  const { data: title } = useReadContract({
    address, abi: VOTING_POLL_ABI, functionName: "title",
  });
  const { data: votingActive } = useReadContract({
    address, abi: VOTING_POLL_ABI, functionName: "votingActive",
  });
  const { data: votingEndTime } = useReadContract({
    address, abi: VOTING_POLL_ABI, functionName: "votingEndTime",
  });
  const { data: candidateCount } = useReadContract({
    address, abi: VOTING_POLL_ABI, functionName: "candidateCount",
  });
  const { data: hasVoted } = useReadContract({
    address, abi: VOTING_POLL_ABI, functionName: "hasVoted", args: [userAddress || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress }
  });
  const { data: admin } = useReadContract({
    address, abi: VOTING_POLL_ABI, functionName: "admin",
  });

  // 2. Fetch Candidates (Naive loop for M1)
  // In prod, use multicall or subgraph. Here we just loop hooks or assume small count.
  // Since hooks inside loops are bad, we'll create a sub-component for the list or just fetch a fixed number.
  // Better approach for pure React: Use a single hook that fetches all candidates if count is known.
  // For now, let's assume max 10 candidates and just render a list component that fetches its own data.
  
  // 3. Write Hooks
  const { data: voteHash, writeContract: vote, isPending: isVoting } = useWriteContract();
  const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({ hash: voteHash });
  
  const { data: adminHash, writeContract: adminAction, isPending: isAdminPending } = useWriteContract();
  const { isLoading: isAdminConfirming, isSuccess: isAdminSuccess } = useWaitForTransactionReceipt({ hash: adminHash });

  const handleVote = () => {
    if (!selectedCandidate) return;
    vote({
        address,
        abi: VOTING_POLL_ABI,
        functionName: "vote",
        args: [BigInt(selectedCandidate)],
    });
  };

  const handleStartVoting = () => {
    adminAction({
        address,
        abi: VOTING_POLL_ABI,
        functionName: "startVoting",
        args: [BigInt(60)], // Default 60 mins for demo
    });
  };

  const handleEndVoting = () => {
    adminAction({
        address,
        abi: VOTING_POLL_ABI,
        functionName: "endVoting",
    });
  };

  const isAdmin = userAddress && admin && userAddress.toLowerCase() === admin.toLowerCase();
  const isInteractionPending = isVoting || isVoteConfirming || isAdminPending || isAdminConfirming;

  if (isVoteSuccess || isAdminSuccess) {
     router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: INTEL & STATUS */}
        <div className="space-y-6">
            <div className="bg-[#0a0a0f] border-2 border-slate-800 p-6">
                <div className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">PROTOCOL_ID</div>
                <div className="text-xs font-mono text-slate-400 break-all mb-6">{address}</div>
                
                <h1 className="text-3xl font-black text-white uppercase break-words mb-4 leading-tight">{title}</h1>
                
                <div className="flex items-center gap-4 text-xs font-bold tracking-widest">
                    <StatusBadge active={!!votingActive} />
                    {hasVoted && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> VOTE_CAST</span>}
                </div>
            </div>

            {isAdmin && (
                <div className="bg-slate-900/50 border border-slate-700 p-6 border-dashed">
                    <div className="text-[10px] text-orange-500 font-bold tracking-widest mb-4 flex items-center gap-2">
                        <User size={12} /> ADMIN_OVERRIDE_ENABLED
                    </div>
                    <div className="flex flex-col gap-2">
                        {!votingActive && (
                            <button 
                                onClick={handleStartVoting}
                                disabled={isInteractionPending}
                                className="bg-emerald-900/30 text-emerald-500 border border-emerald-500/50 p-3 text-xs font-bold uppercase hover:bg-emerald-500 hover:text-black transition-colors"
                            >
                                <Play size={12} className="inline mr-2" /> Initialize Voting (60m)
                            </button>
                        )}
                        {votingActive && (
                            <button 
                                onClick={handleEndVoting}
                                disabled={isInteractionPending}
                                className="bg-red-900/30 text-red-500 border border-red-500/50 p-3 text-xs font-bold uppercase hover:bg-red-500 hover:text-black transition-colors"
                            >
                                <Square size={12} className="inline mr-2" /> Terminate Voting
                            </button>
                        )}
                        <button className="bg-slate-800 text-slate-400 border border-slate-700 p-3 text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors">
                            + Deployed Candidate
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* MIDDLE COLUMN: CANDIDATES */}
        <div className="lg:col-span-2">
            <div className="bg-[#0a0a0f] border-t-2 border-b-2 border-slate-800 min-h-[400px]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-white tracking-widest">CANDIDATE_REGISTRY</span>
                    <span className="text-[10px] text-slate-500">TOTAL: {candidateCount?.toString() || '0'}</span>
                </div>
                
                <div className="p-6 space-y-2">
                    {/* Render Candidates List */}
                    {candidateCount && Number(candidateCount) > 0 ? (
                        <CandidateList 
                            address={address} 
                            count={Number(candidateCount)} 
                            selectedId={selectedCandidate}
                            onSelect={setSelectedCandidate}
                            votingActive={!!votingActive}
                            hasVoted={!!hasVoted}
                        />
                    ) : (
                        <div className="text-slate-500 text-center py-12 text-sm font-mono">NO_CANDIDATES_DEPLOYED</div>
                    )}
                </div>

                {/* Vote Action Bar */}
                {votingActive && !hasVoted && (
                    <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex justify-end">
                        <button
                            onClick={handleVote}
                            disabled={!selectedCandidate || isInteractionPending}
                            className="bg-cyan-600 text-black font-black px-8 py-4 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                        >
                            {isInteractionPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            TRANSMIT_VOTE
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
    if (active) {
        return (
            <div className="flex items-center text-emerald-500">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                POLL_ACTIVE
            </div>
        )
    }
    return (
        <div className="flex items-center text-slate-500">
             <span className="h-2 w-2 mr-2 bg-slate-600 rounded-full"></span>
             POLL_CLOSED
        </div>
    )
}

function CandidateList({ address, count, selectedId, onSelect, votingActive, hasVoted }: any) {
    // Generate array of IDs [1, 2, ... count]
    const ids = Array.from({ length: count }, (_, i) => i + 1);
    
    return (
        <div className="grid gap-3">
            {ids.map(id => (
                <CandidateRow 
                    key={id} 
                    pollAddress={address} 
                    candidateId={id} 
                    selected={selectedId === id}
                    onSelect={() => onSelect(id)}
                    selectable={votingActive && !hasVoted}
                />
            ))}
        </div>
    )
}

function CandidateRow({ pollAddress, candidateId, selected, onSelect, selectable }: any) {
    const { data: candidate } = useReadContract({
        address: pollAddress,
        abi: VOTING_POLL_ABI,
        functionName: "getCandidate",
        args: [BigInt(candidateId)]
    });

    if (!candidate) return <div className="h-16 bg-slate-900/50 animate-pulse" />;

    return (
        <div 
            onClick={selectable ? onSelect : undefined}
            className={`
                relative p-4 border border-slate-800 flex justify-between items-center transition-all
                ${selected ? 'bg-cyan-950/30 border-cyan-500' : 'bg-[#0a0a0f] hover:border-slate-600'}
                ${selectable ? 'cursor-pointer' : 'cursor-default'}
            `}
        >
            <div className="flex items-center gap-4">
                <div className={`
                    w-8 h-8 flex items-center justify-center font-bold text-xs border
                    ${selected ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-slate-900 text-slate-500 border-slate-800'}
                `}>
                    {String(candidateId).padStart(2, '0')}
                </div>
                <div>
                   <div className="text-white font-bold uppercase tracking-wider">{candidate.name}</div>
                </div>
            </div>

            <div className="text-slate-500 font-mono text-xs">
                {candidate.voteCount.toString()} VOTES
            </div>
            
            {selected && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
            )}
        </div>
    )
}
