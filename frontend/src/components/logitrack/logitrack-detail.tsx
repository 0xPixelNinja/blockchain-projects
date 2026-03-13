"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { LOGITRACK_ABI, LOGITRACK_ADDRESS } from "@/lib/contracts";
import { Package, ExternalLink, CheckCircle, XCircle, Loader2, MapPin, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
}

export function LogiTrackDetail({ id }: Props) {
  const numericId = Number(id);
  const [ipfsStatus, setIpfsStatus] = useState<"checking" | "verified" | "unavailable">("checking");
  const [nextStatus, setNextStatus] = useState(1);
  const [nextLocation, setNextLocation] = useState("");
  const [nextNote, setNextNote] = useState("");
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: txHash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: updateSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data, isLoading, isError } = useReadContract({
    address: LOGITRACK_ADDRESS,
    abi: LOGITRACK_ABI,
    functionName: "verifyProduct",
    args: [BigInt(numericId)],
    query: { enabled: !isNaN(numericId) },
  });

  const { data: trackingState } = useReadContract({
    address: LOGITRACK_ADDRESS,
    abi: LOGITRACK_ABI,
    functionName: "getTrackingState",
    args: [BigInt(numericId)],
    query: { enabled: !isNaN(numericId) },
  });

  const { data: trackingHistory } = useReadContract({
    address: LOGITRACK_ADDRESS,
    abi: LOGITRACK_ABI,
    functionName: "getTrackingHistory",
    args: [BigInt(numericId)],
    query: { enabled: !isNaN(numericId) },
  });

  const [exists, productName, origin, qualityDocCID, registrar, registeredAt] = data ?? [];
  const [status, location, lastUpdatedAt] = trackingState ?? [0, "", BigInt(0)];
  const statusLabel = STATUS_LABELS[Number(status)] ?? "Unknown";
  const statusClass = STATUS_CLASSES[Number(status)] ?? STATUS_CLASSES[0];
  const isRegistrar = isConnected && typeof registrar === "string" && typeof address === "string" && registrar.toLowerCase() === address.toLowerCase();

  useEffect(() => {
    if (typeof location === "string") {
      setNextLocation(location);
    }
  }, [location]);

  useEffect(() => {
    if (writeError) {
      setActionError(writeError.message.split("\n")[0]);
    }
  }, [writeError]);

  useEffect(() => {
    if (updateSuccess) {
      setActionError("");
      setNextNote("");
      router.refresh();
    }
  }, [router, updateSuccess]);

  // Check IPFS availability when CID is known -- CID itself is the integrity proof
  useEffect(() => {
    if (!qualityDocCID) return;
    setIpfsStatus("checking");
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs";
    const url = `${gateway}/${qualityDocCID}`;

    fetch(url, { method: "HEAD" })
      .then((res) => {
        setIpfsStatus(res.ok ? "verified" : "unavailable");
      })
      .catch(() => setIpfsStatus("unavailable"));
  }, [qualityDocCID]);

  if (isNaN(numericId)) {
    return <ErrorState message="Invalid tracking ID." />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (isError || !exists) {
    return <ErrorState message={`No product found with tracking ID ${numericId}.`} />;
  }

  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs";
  const ipfsUrl = `${gateway}/${qualityDocCID}`;
  const registeredDate = registeredAt
    ? new Date(Number(registeredAt) * 1000).toLocaleString()
    : "—";
  const lastUpdatedDate = lastUpdatedAt
    ? new Date(Number(lastUpdatedAt) * 1000).toLocaleString()
    : "—";
  const isUpdating = isPending || isConfirming;

  const handleTrackingUpdate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nextLocation.trim()) return;
    setActionError("");
    writeContract({
      address: LOGITRACK_ADDRESS,
      abi: LOGITRACK_ABI,
      functionName: "updateTracking",
      args: [BigInt(numericId), nextStatus, nextLocation, nextNote],
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/logitrack" className="text-[10px] text-slate-500 hover:text-orange-400 font-mono uppercase tracking-widest transition-colors">
            &larr; Back to LogiTrack
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Package className="w-5 h-5 text-orange-500" />
          <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">
            Tracking ID #{numericId}
          </span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">{productName}</h1>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-orange-400 tracking-widest uppercase">Verified on Sepolia</span>
          </div>
          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InfoBlock label="Product Name" value={productName as string} />
          <InfoBlock label="Origin" value={origin as string} />
          <InfoBlock label="Registered At" value={registeredDate} />
          <InfoBlock label="Registrar" value={`${(registrar as string).slice(0, 6)}...${(registrar as string).slice(-4)}`} mono />
          <InfoBlock label="Current Location" value={String(location || origin || "—")} />
          <InfoBlock label="Last Updated" value={lastUpdatedDate} />
        </div>

        <div className="border border-slate-800 p-5 mb-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quality Document CID</div>
          <div className="text-xs font-mono text-white break-all mb-3">{qualityDocCID as string}</div>

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
                <span className="text-[10px] text-green-400 font-mono uppercase tracking-widest">Integrity Verified — Document available on IPFS</span>
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
              className="inline-flex items-center gap-2 text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-widest transition-colors"
            >
              <ExternalLink size={12} />
              View Quality Document on IPFS
            </a>
          )}
        </div>

        <div className="border border-slate-800 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-orange-500" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shipment Timeline</div>
          </div>

          <div className="space-y-3">
            {(trackingHistory as TrackingHistoryEntry[] | undefined)?.map((entry, index) => (
              <div key={`${Number(entry.updatedAt)}-${index}`} className="border border-slate-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest border ${STATUS_CLASSES[Number(entry.status)] ?? STATUS_CLASSES[0]}`}>
                    {STATUS_LABELS[Number(entry.status)] ?? "Unknown"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(Number(entry.updatedAt) * 1000).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white font-bold mb-1">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {entry.location}
                </div>
                {entry.note && <p className="text-xs text-slate-400 font-mono">{entry.note}</p>}
                <p className="text-[10px] text-slate-600 font-mono mt-2">
                  Updated by {entry.updatedBy.slice(0, 6)}...{entry.updatedBy.slice(-4)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-800 p-5 mb-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Update Tracking</div>

          {!isRegistrar ? (
            <p className="text-xs text-slate-500 font-mono">Only the registrar wallet can add shipment updates for this product.</p>
          ) : (
            <form onSubmit={handleTrackingUpdate} className="space-y-4">
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Next Status</div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_LABELS.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setNextStatus(index)}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                        nextStatus === index ? `${STATUS_CLASSES[index]} bg-slate-950` : "border-slate-700 text-slate-500 hover:border-slate-500"
                      }`}
                      disabled={isUpdating}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Location</div>
                <input
                  type="text"
                  value={nextLocation}
                  onChange={(event) => setNextLocation(event.target.value)}
                  className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-orange-500 focus:outline-none transition-colors font-mono"
                  placeholder="e.g. Rotterdam Port"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Update Note</div>
                <textarea
                  value={nextNote}
                  onChange={(event) => setNextNote(event.target.value)}
                  className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm h-24 focus:border-orange-500 focus:outline-none transition-colors font-mono resize-none"
                  placeholder="e.g. Customs cleared and loaded to outbound truck"
                  disabled={isUpdating}
                />
              </div>

              {actionError && (
                <div className="bg-red-900/10 border border-red-500/30 p-3">
                  <div className="text-xs font-mono text-red-400">{actionError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating || !nextLocation.trim()}
                className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Confirm in Wallet..." : isConfirming ? "Updating..." : "Add Tracking Update"}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <a
            href={`https://sepolia.etherscan.io/address/${LOGITRACK_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-slate-700 hover:border-orange-500 text-slate-400 hover:text-orange-400 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <ExternalLink size={12} />
            View on Etherscan
          </a>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS = ["Registered", "In Transit", "Checkpoint", "Delivered", "Delayed", "Cancelled"];

const STATUS_CLASSES = [
  "border-slate-600 text-slate-300",
  "border-blue-500/40 text-blue-400",
  "border-orange-500/40 text-orange-400",
  "border-green-500/40 text-green-400",
  "border-yellow-500/40 text-yellow-400",
  "border-red-500/40 text-red-400",
];

interface TrackingHistoryEntry {
  status: number;
  location: string;
  note: string;
  updatedBy: string;
  updatedAt: bigint;
}

function InfoBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-slate-800 p-4">
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm text-white ${mono ? "font-mono" : "font-bold"}`}>{value}</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-10 flex flex-col items-center justify-center gap-4">
      <Package className="w-12 h-12 text-slate-700" />
      <p className="text-slate-400 font-mono text-sm">{message}</p>
      <Link href="/logitrack" className="text-orange-400 text-xs font-mono hover:underline">
        Back to LogiTrack
      </Link>
    </div>
  );
}
