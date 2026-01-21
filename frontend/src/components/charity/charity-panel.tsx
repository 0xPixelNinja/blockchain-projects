"use client";

import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { CHARITY_ADDRESS, CHARITY_ABI } from "@/lib/contracts";
import { useNetwork } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Heart,
  Plus,
  Wallet,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  AlertCircle,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

interface Campaign {
  id: bigint;
  name: string;
  charityAddress: string;
  creator: string;
  totalDonated: bigint;
  active: boolean;
}

interface Donation {
  donor: string;
  amount: bigint;
  timestamp: bigint;
}

function CampaignCard({
  campaign,
  address,
  isAdmin,
  isLoading,
  blockExplorerUrl,
  onDonate,
  onWithdraw,
  onClose,
}: {
  campaign: Campaign;
  address?: string;
  isAdmin: boolean;
  isLoading: boolean;
  blockExplorerUrl?: string;
  onDonate: (id: bigint, amount: string) => void;
  onWithdraw: (id: bigint) => void;
  onClose: (id: bigint) => void;
}) {
  const [donationAmount, setDonationAmount] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);

  const isCharityOwner = address?.toLowerCase() === campaign.charityAddress?.toLowerCase();
  const isCreator = address?.toLowerCase() === campaign.creator?.toLowerCase();

  const { data: donationCount } = useReadContract({
    address: CHARITY_ADDRESS,
    abi: CHARITY_ABI,
    functionName: "getCampaignDonationCount",
    args: [campaign.id],
  });

  const { data: userContribution } = useReadContract({
    address: CHARITY_ADDRESS,
    abi: CHARITY_ABI,
    functionName: "getDonorContribution",
    args: address ? [campaign.id, address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const donationIds = donationCount
    ? Array.from({ length: Math.min(Number(donationCount), 10) }, (_, i) =>
        BigInt(Number(donationCount) - 1 - i)
      )
    : [];

  const { data: donationsData } = useReadContracts({
    contracts: donationIds.map((idx) => ({
      address: CHARITY_ADDRESS,
      abi: CHARITY_ABI,
      functionName: "getCampaignDonation",
      args: [campaign.id, idx],
    })),
    query: {
      enabled: expanded && donationIds.length > 0,
    },
  });

  useEffect(() => {
    if (expanded && donationsData) {
      setLoadingDonations(true);
      const parsed = donationsData
        .filter((d) => d.status === "success" && d.result)
        .map((d) => {
          const r = d.result as unknown as { donor: string; amount: bigint; timestamp: bigint };
          return { donor: r.donor, amount: r.amount, timestamp: r.timestamp } as Donation;
        });
      setDonations(parsed);
      setLoadingDonations(false);
    }
  }, [donationsData, expanded]);

  const progressPercent = Math.min(
    (Number(formatEther(campaign.totalDonated || BigInt(0))) / 10) * 100,
    100
  );

  return (
    <Card className={!campaign.active ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {campaign.name}
              {isCharityOwner && (
                <Badge variant="outline" className="text-xs">Your Campaign</Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              <span className="font-mono text-xs">
                {campaign.charityAddress ? `${campaign.charityAddress.slice(0, 6)}...${campaign.charityAddress.slice(-4)}` : "0x00...0000"}
              </span>
              {campaign.charityAddress && (
                <a
                  href={`${blockExplorerUrl}/address/${campaign.charityAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardDescription>
          </div>
          <Badge variant={campaign.active ? "default" : "secondary"} className="gap-1">
            {campaign.active ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Active
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Closed
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Raised</span>
            <span className="font-semibold text-lg">
              {formatEther(campaign.totalDonated || BigInt(0))} ETH
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Number(donationCount) || 0} donations</span>
            {userContribution && Number(userContribution) > 0 && (
              <span className="text-primary font-medium">
                Your contribution: {formatEther(userContribution)} ETH
              </span>
            )}
          </div>
        </div>

        {campaign.active && (
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder="ETH amount"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                onDonate(campaign.id, donationAmount);
                setDonationAmount("");
              }}
              disabled={isLoading || !donationAmount || Number(donationAmount) <= 0}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              Donate
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {isCharityOwner && campaign.totalDonated > BigInt(0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onWithdraw(campaign.id)}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Withdraw Funds
            </Button>
          )}
          {isCreator && campaign.active && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onClose(campaign.id)}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Close Campaign
            </Button>
          )}
        </div>

        {Number(donationCount) > 0 && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground hover:bg-transparent px-0"
            >
              <span>Recent Donations</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {expanded && (
              <div className="mt-3">
                {loadingDonations ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No donations yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {donations.map((donation, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Heart className="h-3 w-3 text-primary" />
                          </div>
                          <span className="font-mono text-xs">
                            {donation.donor ? `${donation.donor.slice(0, 6)}...${donation.donor.slice(-4)}` : "0x00...0000"}
                          </span>
                          {donation.donor?.toLowerCase() === address?.toLowerCase() && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatEther(donation.amount || BigInt(0))} ETH</p>
                          <p className="text-xs text-muted-foreground">
                            {donation.timestamp ? new Date(Number(donation.timestamp) * 1000).toLocaleDateString() : "Unknown"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CharityPanel() {
  const { address, isConnected } = useAccount();
  const { isWrongNetwork, switchToCorrectNetwork, isSwitching, expectedChain } = useNetwork();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [campaignName, setCampaignName] = useState("");
  const [charityAddress, setCharityAddress] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");
  const prevIsSuccess = useRef(false);

  const { data: admin } = useReadContract({
    address: CHARITY_ADDRESS,
    abi: CHARITY_ABI,
    functionName: "admin",
  });

  const { data: campaignCount, refetch: refetchCount } = useReadContract({
    address: CHARITY_ADDRESS,
    abi: CHARITY_ABI,
    functionName: "campaignCount",
    query: { refetchInterval: 10000 },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isAdmin = address?.toLowerCase() === admin?.toLowerCase();
  const isLoading = isPending || isConfirming;

  const campaignIds = campaignCount
    ? Array.from({ length: Number(campaignCount) }, (_, i) => BigInt(i + 1))
    : [];

  const { data: campaignsData, refetch: refetchCampaigns } = useReadContracts({
    contracts: campaignIds.map((id) => ({
      address: CHARITY_ADDRESS,
      abi: CHARITY_ABI,
      functionName: "getCampaign",
      args: [id],
    })),
    query: {
      enabled: campaignIds.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (campaignsData) {
      const parsed = campaignsData
        .filter((c) => c.status === "success" && c.result)
        .map((c) => {
          const r = c.result as unknown as { id: bigint; name: string; charityAddress: string; creator: string; totalDonated: bigint; active: boolean };
          return { id: r.id, name: r.name, charityAddress: r.charityAddress, creator: r.creator, totalDonated: r.totalDonated, active: r.active } as Campaign;
        });
      startTransition(() => setCampaigns(parsed));
    }
  }, [campaignsData]);

  const refetchAll = useCallback(() => {
    refetchCount();
    refetchCampaigns();
  }, [refetchCount, refetchCampaigns]);

  useEffect(() => {
    if (isSuccess && !prevIsSuccess.current) {
      toast.success("Transaction confirmed!");
      startTransition(() => {
        setCampaignName("");
        setCharityAddress("");
        setDialogOpen(false);
      });
      refetchAll();
      reset();
    }
    prevIsSuccess.current = isSuccess;
  }, [isSuccess, refetchAll, reset]);

  const handleCreateCampaign = () => {
    if (!campaignName.trim() || !charityAddress.trim()) return;
    writeContract({
      address: CHARITY_ADDRESS,
      abi: CHARITY_ABI,
      functionName: "createCampaign",
      args: [campaignName, charityAddress as `0x${string}`],
    });
  };

  const handleDonate = (campaignId: bigint, amount: string) => {
    if (!amount || Number(amount) <= 0) return;
    writeContract({
      address: CHARITY_ADDRESS,
      abi: CHARITY_ABI,
      functionName: "donate",
      args: [campaignId],
      value: parseEther(amount),
    });
  };

  const handleWithdraw = (campaignId: bigint) => {
    writeContract({
      address: CHARITY_ADDRESS,
      abi: CHARITY_ABI,
      functionName: "withdrawFunds",
      args: [campaignId],
    });
  };

  const handleCloseCampaign = (campaignId: bigint) => {
    writeContract({
      address: CHARITY_ADDRESS,
      abi: CHARITY_ABI,
      functionName: "closeCampaign",
      args: [campaignId],
    });
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (!c.name) return false;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && c.active) ||
      (filterStatus === "closed" && !c.active);
    return matchesSearch && matchesStatus;
  });

  const totalRaised = campaigns.reduce(
    (sum, c) => sum + (c.totalDonated ? Number(formatEther(c.totalDonated)) : 0),
    0
  );

  const activeCampaigns = campaigns.filter((c) => c.active).length;

  if (!mounted || !isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Charity Donations</h1>
            <p className="text-muted-foreground mt-1">
              Support causes with transparent, traceable donations
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Connect your wallet to browse campaigns, make donations, or create new fundraising campaigns.
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
            <h1 className="text-3xl font-bold">Charity Donations</h1>
            <p className="text-muted-foreground mt-1">
              Support causes with transparent, traceable donations
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Charity Donations</h1>
          <p className="text-muted-foreground mt-1">
            Support causes with transparent, traceable donations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-xs text-muted-foreground">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRaised.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground">ETH Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {campaigns.filter(
                    (c) => c.charityAddress?.toLowerCase() === address?.toLowerCase()
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">Your Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>Browse and donate to active fundraising campaigns</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === "closed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("closed")}
                >
                  Closed
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Campaign</DialogTitle>
                      <DialogDescription>
                        Set up a new fundraising campaign for a charity
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Campaign Name</Label>
                        <Input
                          placeholder="Save the Rainforest"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Charity Wallet Address</Label>
                        <Input
                          placeholder="0x..."
                          value={charityAddress}
                          onChange={(e) => setCharityAddress(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          This address will be able to withdraw donated funds
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleCreateCampaign}
                        disabled={isLoading || !campaignName.trim() || !charityAddress.trim()}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Campaign
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {campaigns.length === 0 ? "No Campaigns Yet" : "No Matching Campaigns"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {campaigns.length === 0
                  ? isAdmin
                    ? "Create your first campaign using the button above."
                    : "Waiting for campaigns to be created."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id.toString()}
                  campaign={campaign}
                  address={address}
                  isAdmin={isAdmin}
                  isLoading={isLoading}
                  blockExplorerUrl={expectedChain.blockExplorers?.default.url}
                  onDonate={handleDonate}
                  onWithdraw={handleWithdraw}
                  onClose={handleCloseCampaign}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
