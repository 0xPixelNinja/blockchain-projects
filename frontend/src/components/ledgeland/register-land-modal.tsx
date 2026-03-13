"use client";

import { useState, useEffect, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { LAND_REGISTRY_ABI, LAND_REGISTRY_ADDRESS } from "@/lib/contracts";
import { X, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function RegisterLandModal({ onClose }: { onClose: () => void }) {
  const [landId, setLandId] = useState("");
  const [location, setLocation] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [cidMode, setCidMode] = useState<"manual" | "upload">("manual");
  const [manualCid, setManualCid] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) { onClose(); router.refresh(); }
  }, [isSuccess, onClose, router]);

  useEffect(() => {
    if (writeError) setError(writeError.message.split("\n")[0]);
  }, [writeError]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/pinata", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed"); setUploading(false); return; }
      setIpfsHash(data.ipfsHash);
    } catch {
      setError("Network error during upload");
    }
    setUploading(false);
  };

  const resolvedCid = cidMode === "manual" ? manualCid : ipfsHash;
  const isProcessing = uploading || isPending || isConfirming;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lid = Number(landId);
    if (!landId || isNaN(lid) || !location || !ownerAddress || !resolvedCid) return;
    setError("");
    writeContract({
      address: LAND_REGISTRY_ADDRESS,
      abi: LAND_REGISTRY_ABI,
      functionName: "registerLand",
      args: [BigInt(lid), location, ownerAddress as `0x${string}`, resolvedCid],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0f] border border-slate-700 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Register Land</h2>
          <p className="text-xs text-slate-500 font-mono">Single land record registration on-chain</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Land ID">
            <input
              type="text"
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-rose-500 focus:outline-none transition-colors font-mono"
              placeholder="e.g. 8801"
              disabled={isProcessing}
            />
          </Field>

          <Field label="Location">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-rose-500 focus:outline-none transition-colors font-mono"
              placeholder="e.g. Block A, Street 5"
              disabled={isProcessing}
            />
          </Field>

          <Field label="Owner Wallet Address">
            <input
              type="text"
              value={ownerAddress}
              onChange={(e) => setOwnerAddress(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-rose-500 focus:outline-none transition-colors font-mono"
              placeholder="0x..."
              disabled={isProcessing}
            />
          </Field>

          <Field label="Deed Document CID">
            <div className="flex gap-2 mb-2">
              {(["manual", "upload"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setCidMode(m); setIpfsHash(""); setManualCid(""); setFile(null); }}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                    cidMode === m ? "border-rose-500 text-rose-400" : "border-slate-700 text-slate-500 hover:border-slate-500"
                  }`}
                >
                  {m === "manual" ? "Enter CID" : "Upload File"}
                </button>
              ))}
            </div>

            {cidMode === "manual" ? (
              <input
                type="text"
                value={manualCid}
                onChange={(e) => setManualCid(e.target.value)}
                className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-rose-500 focus:outline-none transition-colors font-mono"
                placeholder="QmLegalDocument..."
                disabled={isProcessing}
              />
            ) : (
              <>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(e) => { setFile(e.target.files?.[0] || null); setIpfsHash(""); }} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full bg-[#050505] border border-dashed border-slate-700 text-slate-400 p-4 text-xs font-mono flex items-center justify-center gap-2 hover:border-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50"
                >
                  <Upload size={16} />
                  {file ? file.name : "SELECT_FILE"}
                </button>
                {file && !ipfsHash && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full mt-2 bg-slate-900 border border-slate-700 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading ? "Uploading to IPFS..." : "Upload to IPFS"}
                  </button>
                )}
                {ipfsHash && (
                  <div className="mt-2 bg-rose-900/10 border border-rose-500/30 p-3">
                    <div className="text-[9px] text-rose-400 font-bold tracking-widest mb-1">IPFS_HASH</div>
                    <div className="text-xs font-mono text-white break-all">{ipfsHash}</div>
                  </div>
                )}
              </>
            )}
          </Field>

          {!isConnected && (
            <div className="bg-yellow-900/10 border border-yellow-500/30 p-3">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1">Wallet Not Connected</div>
              <div className="text-xs font-mono text-yellow-300/70">Connect your wallet to register on blockchain.</div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/10 border border-red-500/30 p-3">
              <div className="text-xs font-mono text-red-400">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || !landId || !location || !ownerAddress || !resolvedCid || !isConnected}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(isPending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Confirm in Wallet..." : isConfirming ? "Registering..." : "Register on Blockchain"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  );
}
