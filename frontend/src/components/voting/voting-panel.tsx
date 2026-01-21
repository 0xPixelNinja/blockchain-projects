"use client";

import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { VOTING_FACTORY_ADDRESS, VOTING_FACTORY_ABI, VOTING_POLL_ABI } from "@/lib/contracts";
import { useNetwork } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Vote,
  Users,
  Clock,
  Trophy,
  Plus,
  UserPlus,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Shield,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";

interface Candidate {
  id: bigint;
  name: string;
  voteCount: bigint;
}

function CountdownTimer({ endTime }: { endTime: bigint }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const end = Number(endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono font-medium">{timeLeft}</span>
    </div>
  );
}

function PollSummaryCard({ address, onSelect }: { address: string, onSelect: () => void }) {
    const { data: title } = useReadContract({
        address: address as `0x${string}`,
        abi: VOTING_POLL_ABI,
        functionName: "title",
    });

    const { data: isActive } = useReadContract({
        address: address as `0x${string}`,
        abi: VOTING_POLL_ABI,
        functionName: "votingActive",
    });
    
    const { data: isPublic } = useReadContract({
        address: address as `0x${string}`,
        abi: VOTING_POLL_ABI,
        functionName: "isPublic",
    });

    return (
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={onSelect}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{title || "Loading Poll..."}</CardTitle>
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Closed"}
                    </Badge>
                </div>
                <CardDescription className="flex items-center gap-2 text-xs font-mono">
                    <span className="truncate">{address}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                        {isPublic ? "Public Voting" : "Whitelist Only"}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function PollInterface({ pollAddress, onBack }: { pollAddress: `0x${string}`, onBack: () => void }) {
  const { address, isConnected } = useAccount();
  const [candidateName, setCandidateName] = useState("");
  const [voterAddress, setVoterAddress] = useState("");
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [duration, setDuration] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [whitelistOpen, setWhitelistOpen] = useState(false);
  const prevIsSuccess = useRef(false);

  const { data: title } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "title",
  });

  const { data: admin } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "admin",
  });

  const { data: isPublic } = useReadContract({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "isPublic",
  });

  const { data: candidateCount, refetch: refetchCount } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "candidateCount",
    query: { refetchInterval: 10000 },
  });

  const { data: votingActive, refetch: refetchVotingActive } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "votingActive",
    query: { refetchInterval: 5000 },
  });

  const { data: votingEndTime } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "votingEndTime",
    query: { refetchInterval: 5000 },
  });

  const { data: isWhitelisted } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "whitelistedVoters",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isPublic }, // Only fetch if private
  });

  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "hasVoted",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: userVotedFor } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "voterVotedFor",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!hasVoted },
  });

  const { data: winner } = useReadContract({
    address: pollAddress,
    abi: VOTING_POLL_ABI,
    functionName: "getWinner",
    query: { enabled: votingActive === false && Number(candidateCount) > 0 },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isAdmin = address?.toLowerCase() === (admin as string)?.toLowerCase();
  const isLoading = isPending || isConfirming;
  const canVote = isPublic || isWhitelisted;

  const refetchAll = useCallback(() => {
    refetchCount();
    refetchVotingActive();
    refetchHasVoted();
  }, [refetchCount, refetchVotingActive, refetchHasVoted]);

  useEffect(() => {
    if (isSuccess && !prevIsSuccess.current) {
      toast.success("Transaction confirmed!");
      startTransition(() => {
        setCandidateName("");
        setVoterAddress("");
        setBulkAddresses("");
        setDuration("");
        setAddCandidateOpen(false);
        setWhitelistOpen(false);
      });
      refetchAll();
      reset();
    }
    prevIsSuccess.current = isSuccess;
  }, [isSuccess, refetchAll, reset]);

  const candidateIds = candidateCount
    ? Array.from({ length: Number(candidateCount) }, (_, i) => BigInt(i + 1))
    : [];

  const { data: candidatesData, refetch: refetchCandidates } = useReadContracts({
    contracts: candidateIds.map((id) => ({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "getCandidate",
      args: [id],
    })),
    query: {
      enabled: candidateIds.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (candidatesData) {
      const parsed = candidatesData
        .filter((c) => c.status === "success" && c.result)
        .map((c) => {
          const r = c.result as unknown as { id: bigint; name: string; voteCount: bigint };
          return { id: r.id, name: r.name, voteCount: r.voteCount } as Candidate;
        });
      startTransition(() => setCandidates(parsed));
    }
  }, [candidatesData]);

  useEffect(() => {
    if (isSuccess) {
      refetchCandidates();
    }
  }, [isSuccess, refetchCandidates]);

  const handleAddCandidate = () => {
    if (!candidateName.trim()) return;
    writeContract({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "addCandidate",
      args: [candidateName],
    });
  };

  const handleWhitelistVoter = () => {
    if (!voterAddress.trim()) return;
    writeContract({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "whitelistVoter",
      args: [voterAddress as `0x${string}`],
    });
  };

  const handleBulkWhitelist = () => {
    const addresses = bulkAddresses
      .split(/[\n,]/)
      .map((a) => a.trim())
      .filter((a) => a.startsWith("0x"));
    
    if (addresses.length === 0) return;
    
    writeContract({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "whitelistVoter",
      args: [addresses[0] as `0x${string}`],
    });
    toast.info(`Whitelisting ${addresses.length} address(es). First one submitted.`);
  };

  const handleStartVoting = () => {
    if (!duration) return;
    writeContract({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "startVoting",
      args: [BigInt(duration)],
    });
  };

  const handleEndVoting = () => {
    writeContract({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "endVoting",
    });
  };

  const handleVote = (candidateId: bigint) => {
    writeContract({
      address: pollAddress,
      abi: VOTING_POLL_ABI,
      functionName: "vote",
      args: [candidateId],
    });
  };

  const filteredCandidates = candidates.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVotes = candidates.reduce((sum, c) => sum + Number(c.voteCount), 0);
  const userVotedCandidate = hasVoted && userVotedFor
    ? candidates.find((c) => c.id === userVotedFor)
    : null;

  return (
    <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Polls
        </Button>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">{pollAddress}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={votingActive ? "default" : "secondary"} className="gap-1">
            {votingActive ? <Play className="h-3 w-3" /> : <Square className="h-3 w-3" />}
            {votingActive ? "Voting Active" : "Voting Inactive"}
          </Badge>
          <Badge variant="outline">
              {isPublic ? "Public" : "Private"}
          </Badge>
          {!isPublic && isWhitelisted && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Whitelisted
            </Badge>
          )}
          {hasVoted && (
            <Badge variant="secondary" className="gap-1">
              <Vote className="h-3 w-3" />
              Voted
            </Badge>
          )}
          {isAdmin && (
            <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
        </div>
      </div>
      
      {/* Existing Card Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.length}</p>
                <p className="text-xs text-muted-foreground">Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Vote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVotes}</p>
                <p className="text-xs text-muted-foreground">Total Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                {votingActive && votingEndTime ? (
                  <CountdownTimer endTime={votingEndTime} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not active</p>
                )}
                <p className="text-xs text-muted-foreground">Time Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                {winner && !votingActive ? (
                  <>
                    <p className="text-sm font-semibold truncate max-w-[120px]">{winner[1]}</p>
                    <p className="text-xs text-muted-foreground">{winner[2].toString()} votes</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">TBD</p>
                )}
                <p className="text-xs text-muted-foreground">Winner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Existing logic continued... */}
      {hasVoted && userVotedCandidate && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">You voted for: {userVotedCandidate.name}</p>
                <p className="text-sm text-muted-foreground">
                  Your vote has been recorded on the blockchain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!votingActive && winner && Number(winner[2]) > 0 && (
         <Card className="border-amber-500/50 bg-amber-500/5">
         <CardHeader>
           <div className="flex items-center gap-3">
             <Trophy className="h-6 w-6 text-amber-500" />
             <div>
               <CardTitle>Election Results</CardTitle>
               <CardDescription>The voting has ended</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="flex items-center justify-between">
             <div>
               <p className="text-2xl font-bold">{winner[1]}</p>
               <p className="text-muted-foreground">Winner with {winner[2].toString()} votes</p>
             </div>
             <Badge variant="outline" className="text-lg px-4 py-2">
               #{winner[0].toString()}
             </Badge>
           </div>
         </CardContent>
       </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Controls
            </CardTitle>
            <CardDescription>
              Manage candidates, voters, and voting sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Dialog open={addCandidateOpen} onOpenChange={setAddCandidateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Candidate</DialogTitle>
                    <DialogDescription>
                      Enter the name of the candidate to add to the election
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Candidate Name</Label>
                      <Input
                        placeholder="Enter candidate name"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAddCandidate}
                      disabled={isLoading || !candidateName.trim()}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Candidate
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

             {!isPublic && (
                 <Dialog open={whitelistOpen} onOpenChange={setWhitelistOpen}>
                 <DialogTrigger asChild>
                   <Button variant="outline" className="gap-2">
                     <UserPlus className="h-4 w-4" />
                     Whitelist Voters
                   </Button>
                 </DialogTrigger>
                 <DialogContent>
                   <DialogHeader>
                     <DialogTitle>Whitelist Voters</DialogTitle>
                     <DialogDescription>
                       Add wallet addresses to allow them to vote (Private Poll)
                     </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-4 pt-4">
                     <div className="space-y-2">
                       <Label>Single Address</Label>
                       <div className="flex gap-2">
                         <Input
                           placeholder="0x..."
                           value={voterAddress}
                           onChange={(e) => setVoterAddress(e.target.value)}
                         />
                         <Button
                           onClick={handleWhitelistVoter}
                           disabled={isLoading || !voterAddress.trim()}
                         >
                           {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Add
                         </Button>
                       </div>
                     </div>
                     <div className="relative">
                       <div className="absolute inset-0 flex items-center">
                         <span className="w-full border-t" />
                       </div>
                       <div className="relative flex justify-center text-xs uppercase">
                         <span className="bg-background px-2 text-muted-foreground">or</span>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <Label>Bulk Add (comma or newline separated)</Label>
                       <Textarea
                         className="min-h-[100px]"
                         placeholder="0x123...&#10;0x456...&#10;0x789..."
                         value={bulkAddresses}
                         onChange={(e) => setBulkAddresses(e.target.value)}
                       />
                       <Button
                         variant="secondary"
                         className="w-full"
                         onClick={handleBulkWhitelist}
                         disabled={isLoading || !bulkAddresses.trim()}
                       >
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         Whitelist All
                       </Button>
                     </div>
                   </div>
                 </DialogContent>
               </Dialog>
             )}

              {!votingActive ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Duration (minutes)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-40"
                  />
                  <Button
                    onClick={handleStartVoting}
                    disabled={isLoading || !duration}
                    className="gap-2"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Play className="h-4 w-4" />
                    Start Voting
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleEndVoting}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Square className="h-4 w-4" />
                  End Voting
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate List (Same as before) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Candidates</CardTitle>
              <CardDescription>
                {votingActive
                  ? "Cast your vote for your preferred candidate"
                  : "View all registered candidates"}
              </CardDescription>
            </div>
            {candidates.length > 0 && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
            {/* Same Table Logic as before */}
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Candidates Yet</h3>
              <p className="text-muted-foreground max-w-md">
                {isAdmin
                  ? "Add candidates using the admin controls above to get started."
                  : "Waiting for the admin to add candidates."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="w-32">Votes</TableHead>
                    <TableHead className="w-32">Share</TableHead>
                    <TableHead className="w-28 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => {
                    const votePercent = totalVotes > 0
                      ? ((Number(candidate.voteCount || BigInt(0)) / totalVotes) * 100).toFixed(1)
                      : "0";
                    const isUserVote = userVotedFor === candidate.id;
                    const isWinner = winner && winner[0] === candidate.id && !votingActive;

                    return (
                      <TableRow key={candidate.id.toString()} className={isWinner ? "bg-amber-500/5" : ""}>
                        <TableCell className="font-mono text-muted-foreground">
                          #{candidate.id.toString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{candidate.name}</span>
                            {isUserVote && (
                              <Badge variant="outline" className="text-xs">Your Vote</Badge>
                            )}
                            {isWinner && (
                              <Badge className="bg-amber-500 text-xs gap-1">
                                <Trophy className="h-3 w-3" />
                                Winner
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{candidate.voteCount.toString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${votePercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{votePercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleVote(candidate.id)}
                            disabled={
                              !votingActive ||
                              !canVote ||
                              hasVoted ||
                              isLoading
                            }
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Vote"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!canVote && !hasVoted && votingActive && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">You are not whitelisted</p>
                <p className="text-sm text-muted-foreground">
                  This is a private poll. Contact the administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function VotingPanel() {
    const { isConnected } = useAccount();
    const { isWrongNetwork, switchToCorrectNetwork, isSwitching, expectedChain } = useNetwork();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const { writeContract, data: hash, isPending, reset } = useWriteContract();
    
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const { data: pollsData, refetch } = useReadContract({
        address: VOTING_FACTORY_ADDRESS,
        abi: VOTING_FACTORY_ABI,
        functionName: "getDeployedPolls",
        query: { refetchInterval: 5000 },
    });
    
    useEffect(() => {
        if (isSuccess) {
            toast.success("Poll Created!");
            setCreateOpen(false);
            setTitle("");
            reset();
            refetch();
        }
    }, [isSuccess]);

    const handleCreatePoll = () => {
        if (!title.trim()) return;
        writeContract({
            address: VOTING_FACTORY_ADDRESS,
            abi: VOTING_FACTORY_ABI,
            functionName: "createPoll",
            args: [title, isPublic],
        });
    }

    if (!mounted || !isConnected) {
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Decentralized Voting Platform</h1>
                <p className="text-muted-foreground mt-1">
                  Create and participate in voting campaings
                </p>
              </div>
            </div>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Vote className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Connect your wallet to browse or create polls.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

    if (isWrongNetwork) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Decentralized Voting Platform</h1>
              <p className="text-muted-foreground mt-1">
                Create and participate in voting campaigns
              </p>
            </div>
          </div>
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Wrong Network</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Please switch to {expectedChain.name} to interact with this dApp.
                This ensures you are using test ETH, not real funds.
              </p>
              <Button onClick={switchToCorrectNetwork} disabled={isSwitching}>
                {isSwitching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  `Switch to ${expectedChain.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (selectedPoll) {
        return <PollInterface pollAddress={selectedPoll as `0x${string}`} onBack={() => setSelectedPoll(null)} />
    }

    const polls = pollsData ? [...pollsData].reverse() : []; // Newest first

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Voting Polls</h1>
                    <p className="text-muted-foreground mt-1">
                        Explore active campaigns or start your own
                    </p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                             <Plus className="h-4 w-4" /> Create Poll
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Poll</DialogTitle>
                            <DialogDescription>
                                Launch a new decentralized voting campaign.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Poll Title</Label>
                                <Input 
                                    placeholder="Community Proposal #1" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="public-voting">Public Voting</Label>
                                    <p className="text-xs text-muted-foreground">Allow anyone to vote without whitelist</p>
                                </div>
                                <Switch
                                    id="public-voting"
                                    checked={isPublic}
                                    onCheckedChange={setIsPublic}
                                />
                            </div>
                            <Button className="w-full" onClick={handleCreatePoll} disabled={isPending || !title.trim()}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Poll
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {polls.length === 0 ? (
                 <Card>
                 <CardContent className="flex flex-col items-center justify-center py-16">
                   <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                   <h3 className="text-lg font-semibold mb-2">No Polls Yet</h3>
                   <p className="text-muted-foreground text-center max-w-md">
                     Be the first to create a voting campaign!
                   </p>
                 </CardContent>
               </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {polls.map((addr) => (
                        <PollSummaryCard key={addr} address={addr} onSelect={() => setSelectedPoll(addr)} />
                    ))}
                </div>
            )}
        </div>
    )
}
