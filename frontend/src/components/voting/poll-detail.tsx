"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { VOTING_POLL_ABI } from "@/lib/contracts";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, User, Trophy, Play, Square, Plus, Shield, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";

export function PollDetail({ address }: { address: `0x${string}` }) {
  const { address: userAddress } = useAccount();
  const router = useRouter();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  
  // Admin Form States
  const [newCandidateName, setNewCandidateName] = useState("");
  const [voterToWhitelist, setVoterToWhitelist] = useState("");
  const [duration, setDuration] = useState(60);

  const { data: title, refetch: refetchTitle } = useReadContract({ address, abi: VOTING_POLL_ABI, functionName: "title" });
  const { data: isPublic, refetch: refetchIsPublic } = useReadContract({ address, abi: VOTING_POLL_ABI, functionName: "isPublic" });
  const { data: votingActive, refetch: refetchVotingActive } = useReadContract({ address, abi: VOTING_POLL_ABI, functionName: "votingActive" });
  const { data: votingEndTime, refetch: refetchVotingEndTime } = useReadContract({ address, abi: VOTING_POLL_ABI, functionName: "votingEndTime" });
  const { data: candidateCount, refetch: refetchCandidateCount } = useReadContract({ address, abi: VOTING_POLL_ABI, functionName: "candidateCount" });
  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address, abi: VOTING_POLL_ABI, functionName: "hasVoted", 
    args: [userAddress || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!userAddress }
  });

  const { data: admin, refetch: refetchAdmin } = useReadContract({ address, abi: VOTING_POLL_ABI, functionName: "admin" });
  const { data: winner, refetch: refetchWinner } = useReadContract({ 
      address, abi: VOTING_POLL_ABI, functionName: "getWinner",
      query: { enabled: !!votingActive === false && Number(candidateCount) > 0 }
  });

  const { data: writeHash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: writeHash });

  useEffect(() => {
    if (isSuccess) {
      refetchTitle();
      refetchIsPublic();
      refetchVotingActive();
      refetchVotingEndTime();
      refetchCandidateCount();
      refetchHasVoted();
      refetchAdmin();
      refetchWinner();
      router.refresh();
    }
  }, [isSuccess, router, refetchTitle, refetchIsPublic, refetchVotingActive, refetchVotingEndTime, refetchCandidateCount, refetchHasVoted, refetchAdmin, refetchWinner]);

  const handleVote = () => {
    if (!selectedCandidate) return;
    writeContract({ address, abi: VOTING_POLL_ABI, functionName: "vote", args: [BigInt(selectedCandidate)] });
  };

  const handleStartVoting = () => {
    writeContract({ address, abi: VOTING_POLL_ABI, functionName: "startVoting", args: [BigInt(duration)] });
  };

  const handleEndVoting = () => {
    writeContract({ address, abi: VOTING_POLL_ABI, functionName: "endVoting" });
  };

  const handleAddCandidate = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newCandidateName) return;
      writeContract({ address, abi: VOTING_POLL_ABI, functionName: "addCandidate", args: [newCandidateName] });
      setNewCandidateName("");
  }

  const handleWhitelistVoter = (e: React.FormEvent) => {
      e.preventDefault();
      if(!isAddress(voterToWhitelist)) return;
      writeContract({ address, abi: VOTING_POLL_ABI, functionName: "whitelistVoter", args: [voterToWhitelist] });
      setVoterToWhitelist("");
  }

  const isAdmin = userAddress && admin && userAddress.toLowerCase() === admin.toLowerCase();
  const isInteractionPending = isPending || isConfirming;
  const isExpired = !!(votingActive && votingEndTime && (Date.now() / 1000 > Number(votingEndTime)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: INTEL & STATUS */}
        <div className="space-y-6">
            <div className="bg-[#0a0a0f] border-2 border-slate-800 p-6 relative">
                <div className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">PROTOCOL_ID</div>
                <div className="text-xs font-mono text-slate-400 break-all mb-6">{address}</div>
                
                <h1 className="text-3xl font-black text-white uppercase break-words mb-4 leading-tight">{title}</h1>
                
                <div className="flex items-center gap-4 text-xs font-bold tracking-widest mb-4">
                    <StatusBadge active={!!votingActive} expired={isExpired} isAdmin={isAdmin} />
                    {hasVoted && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> VOTE_CAST</span>}
                </div>

                {votingActive && votingEndTime && !isExpired && (
                    <div className="mb-6 p-4 bg-slate-900 border border-slate-700">
                        <div className="text-[10px] text-slate-500 font-bold tracking-widest mb-1 flex items-center gap-2">
                             <Timer size={12} /> TIME_REMAINING
                        </div>
                        <div className="text-xl font-mono text-white">
                            <Countdown target={Number(votingEndTime)} />
                        </div>
                    </div>
                )}

                {!votingActive && winner && winner[2] > BigInt(0) && (
                    <div className="p-4 bg-yellow-900/10 border border-yellow-500/50 mt-6">
                        <div className="text-[10px] text-yellow-500 font-bold tracking-widest mb-2 flex items-center gap-2">
                             <Trophy size={12} /> PROTOCOL_WINNER
                        </div>
                        <div className="text-xl font-black text-white">{winner[1]}</div>
                        <div className="text-xs font-mono text-slate-400">{winner[2].toString()} VOTES</div>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="bg-slate-900/50 border border-slate-700 p-6 border-dashed space-y-6">
                    <div className="text-[10px] text-orange-500 font-bold tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                        <User size={12} /> ADMIN_OVERRIDE_ENABLED
                    </div>
                    {/* 1. Voting Controls */}
                    <div className="flex flex-col gap-2">
                        {!votingActive ? (
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Duration (Minutes)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                        className="w-20 bg-black border border-slate-700 p-2 text-xs text-center text-white focus:border-cyan-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleStartVoting}
                                        disabled={isInteractionPending || duration <= 0}
                                        className="flex-1 bg-emerald-900/30 text-emerald-500 border border-emerald-500/50 p-2 text-xs font-bold uppercase hover:bg-emerald-500 hover:text-black transition-colors disabled:opacity-50"
                                    >
                                        <Play size={12} className="inline mr-2" /> Start Voting
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {isExpired && (
                                    <div className="text-[10px] text-red-500 font-bold mb-2 animate-pulse">
                                        ⚠️ TIME EXPIRED - EXECUTE TERMINATION
                                    </div>
                                )}
                                <button 
                                    onClick={handleEndVoting}
                                    disabled={isInteractionPending}
                                    className="w-full bg-red-900/30 text-red-500 border border-red-500/50 p-3 text-xs font-bold uppercase hover:bg-red-500 hover:text-black transition-colors disabled:opacity-50"
                                >
                                    <Square size={12} className="inline mr-2" /> Terminate Voting
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. Add Candidate */}
                    {!votingActive && (
                        <form onSubmit={handleAddCandidate} className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Deploy Candidate</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="NAME" 
                                    value={newCandidateName}
                                    onChange={e => setNewCandidateName(e.target.value)}
                                    className="flex-1 bg-black border border-slate-700 p-2 text-xs text-white focus:border-cyan-500 outline-none"
                                />
                                <button disabled={isInteractionPending || !newCandidateName} type="submit" className="bg-slate-800 p-2 text-slate-400 hover:text-white border border-slate-700">
                                    <Plus size={14} />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* 3. Whitelist (Only if private) */}
                    {!isPublic && (
                         <form onSubmit={handleWhitelistVoter} className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Shield size={10} /> Whitelist Voter
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="0x..." 
                                    value={voterToWhitelist}
                                    onChange={e => setVoterToWhitelist(e.target.value)}
                                    className="flex-1 bg-black border border-slate-700 p-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                                />
                                <button disabled={isInteractionPending || !voterToWhitelist} type="submit" className="bg-slate-800 p-2 text-slate-400 hover:text-white border border-slate-700">
                                    <Plus size={14} />
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {isInteractionPending && (
                        <div className="text-[10px] text-cyan-500 animate-pulse flex items-center justify-center pt-2">
                            <Loader2 size={12} className="mr-2 animate-spin" /> EXECUTING_ON_CHAIN...
                        </div>
                    )}
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
                            isExpired={isExpired}
                            hasVoted={!!hasVoted}
                        />
                    ) : (
                        <div className="text-slate-500 text-center py-12 text-sm font-mono">NO_CANDIDATES_DEPLOYED</div>
                    )}
                </div>

                {/* Vote Action Bar */}
                {votingActive && !hasVoted && !isExpired && (
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
                
                {votingActive && isExpired && (
                     <div className="p-4 border-t border-slate-800 bg-red-900/10 flex justify-center">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                            VOTING PERIOD EXPIRED
                        </span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

function StatusBadge({ active, expired, isAdmin }: { active: boolean, expired?: boolean, isAdmin?: boolean }) {
    if (active && expired) {
        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center text-orange-500">
                    <span className="h-2 w-2 mr-2 bg-orange-500 rounded-full animate-pulse"></span>
                    AWAITING_FINALIZATION
                </div>
                <div className="text-[9px] text-slate-500">
                    {isAdmin ? "Execute termination below" : "Admin must end voting"}
                </div>
            </div>
        )
    }
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

function CandidateList({ address, count, selectedId, onSelect, votingActive, isExpired, hasVoted }: any) {
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
                    selectable={votingActive && !isExpired && !hasVoted}
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

function Countdown({ target }: { target: number }) {
    const [timeLeft, setTimeLeft] = useState<string>("CALCULATING...");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft("00:00:00");
                clearInterval(interval);
                return;
            }

            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [target]);

    return <span>{timeLeft}</span>;
}
