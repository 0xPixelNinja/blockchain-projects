"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { LAND_REGISTRY_ABI, LAND_REGISTRY_ADDRESS } from "@/lib/contracts";
import { Landmark, ExternalLink, CheckCircle, XCircle, Loader2, Users, MapPin, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TransferModal } from "./transfer-modal";

interface Props {
  id: string;
}

export function LandDetail({ id }: Props) {
  const numericId = Number(id);
  const [ipfsStatus, setIpfsStatus] = useState<"checking" | "verified" | "unavailable">("checking");
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const { data: txHash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data, isLoading, isError, refetch } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "getLand",
    args: [BigInt(numericId)],
    query: { enabled: !isNaN(numericId) },
  });

  const { data: ownershipHistory, refetch: refetchHistory } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "getOwnershipHistory",
    args: [BigInt(numericId)],
    query: { enabled: !isNaN(numericId) },
  });

  const { data: registrar } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "registrar",
  });

  const isRegistrar = isConnected && typeof registrar === "string" && typeof address === "string" && registrar.toLowerCase() === address.toLowerCase();

  useEffect(() => {
    if (writeError) setActionError(writeError.message.split("\n")[0]);
  }, [writeError]);

  useEffect(() => {
    if (isSuccess) {
      setActionError("");
      setEditingLocation(false);
      setNewLocation("");
      refetch();
      refetchHistory();
      router.refresh();
    }
  }, [isSuccess, refetch, refetchHistory, router]);

  useEffect(() => {
    if (!data?.deedCID) return;
    setIpfsStatus("checking");
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs";
    const url = `${gateway}/${data.deedCID}`;
    fetch(url, { method: "HEAD" })
      .then((res) => setIpfsStatus(res.ok ? "verified" : "unavailable"))
      .catch(() => setIpfsStatus("unavailable"));
  }, [data?.deedCID]);

  if (isNaN(numericId)) return <ErrorState message="Invalid Land ID." />;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }
  if (isError || !data) return <ErrorState message={`No land record found for ID ${numericId}.`} />;

  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs";
  const ipfsUrl = `${gateway}/${data.deedCID}`;
  const registeredDate = new Date(Number(data.registeredAt) * 1000).toLocaleString();
  const updatedDate = new Date(Number(data.updatedAt) * 1000).toLocaleString();
  const isUpdating = isPending || isConfirming;

  const handleLocationUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    setActionError("");
    writeContract({
      address: LAND_REGISTRY_ADDRESS,
      abi: LAND_REGISTRY_ABI,
      functionName: "updateLocation",
      args: [BigInt(numericId), newLocation],
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/ledgeland" className="text-[10px] text-slate-500 hover:text-rose-400 font-mono uppercase tracking-widest transition-colors">
            &larr; Back to LedgeLand
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Landmark className="w-5 h-5 text-rose-500" />
          <span className="text-[10px] font-bold text-rose-500 tracking-widest uppercase">
            Land ID #{numericId}
          </span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">{data.location}</h1>

        <div className="flex items-center gap-2 mb-8">
          <CheckCircle className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-rose-400 tracking-widest uppercase">Recorded on Sepolia</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InfoBlock label="Land ID" value={String(data.landId)} mono />
          <InfoBlock label="Location" value={data.location} />
          <InfoBlock label="Current Owner" value={`${data.currentOwner.slice(0, 6)}...${data.currentOwner.slice(-4)}`} mono />
          <InfoBlock label="Registered At" value={registeredDate} />
          <InfoBlock label="Last Updated" value={updatedDate} />
          <InfoBlock label="Deed CID" value={data.deedCID} mono />
        </div>

        {isRegistrar && (
          <div className="border border-slate-800 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</div>
              {!editingLocation && (
                <button
                  onClick={() => { setEditingLocation(true); setNewLocation(data.location); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors"
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
            {editingLocation ? (
              <form onSubmit={handleLocationUpdate} className="space-y-3">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm font-mono focus:border-rose-500 focus:outline-none transition-colors"
                  disabled={isUpdating}
                />
                {actionError && (
                  <div className="bg-red-900/10 border border-red-500/30 p-3">
                    <div className="text-xs font-mono text-red-400">{actionError}</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUpdating || !newLocation.trim()}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                    {isPending ? "Confirm..." : isConfirming ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingLocation(false); setActionError(""); }}
                    disabled={isUpdating}
                    className="border border-slate-700 text-slate-400 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-white font-bold">{data.location}</p>
            )}
          </div>
        )}

        <div className="border border-slate-800 p-5 mb-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Deed Document (IPFS)</div>
          <div className="text-xs font-mono text-white break-all mb-3">{data.deedCID}</div>

          <div className="flex items-center gap-2 mb-4">
            {ipfsStatus === "checking" && (
              <>
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Checking IPFS availability...</span>
              </>
            )}
            {ipfsStatus === "verified" && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-[10px] text-green-400 font-mono uppercase tracking-widest">Integrity Verified -- Document available on IPFS</span>
              </>
            )}
            {ipfsStatus === "unavailable" && (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-[10px] text-red-400 font-mono uppercase tracking-widest">Document Unavailable on IPFS</span>
              </>
            )}
          </div>

          {ipfsStatus === "verified" && (
            <a
              href={ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors"
            >
              <ExternalLink size={12} />
              View Deed on IPFS
            </a>
          )}
        </div>

        <div className="border border-slate-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-rose-500" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chain of Custody</div>
          </div>

          <div className="space-y-3">
            {(ownershipHistory as OwnershipHistoryEntry[] | undefined)?.map((entry, index) => (
              <div key={`${Number(entry.timestamp)}-${index}`} className="border border-slate-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(Number(entry.timestamp) * 1000).toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-rose-500/60 tracking-widest uppercase">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white font-bold mb-1">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {entry.owner.slice(0, 6)}...{entry.owner.slice(-4)}
                </div>
                {entry.note && <p className="text-xs text-slate-400 font-mono">{entry.note}</p>}
                <p className="text-[10px] text-slate-600 font-mono mt-2 truncate">Deed: {entry.deedCID}</p>
              </div>
            ))}
          </div>

          {isRegistrar && (
            <button
              onClick={() => setShowTransfer(true)}
              className="mt-4 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
            >
              Transfer Ownership
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <a
            href={`https://sepolia.etherscan.io/address/${LAND_REGISTRY_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-400 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <ExternalLink size={12} />
            View on Etherscan
          </a>
        </div>
      </div>

      {showTransfer && (
        <TransferModal
          landId={numericId}
          currentOwner={data.currentOwner}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => { refetch(); refetchHistory(); }}
        />
      )}
    </div>
  );
}

interface OwnershipHistoryEntry {
  owner: string;
  deedCID: string;
  timestamp: bigint;
  note: string;
}

function InfoBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-slate-800 p-4">
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm text-white ${mono ? "font-mono" : "font-bold"} break-all`}>{value}</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-10 flex flex-col items-center justify-center gap-4">
      <Landmark className="w-12 h-12 text-slate-700" />
      <p className="text-slate-400 font-mono text-sm">{message}</p>
      <Link href="/ledgeland" className="text-rose-400 text-xs font-mono hover:underline">
        Back to LedgeLand
      </Link>
    </div>
  );
}
