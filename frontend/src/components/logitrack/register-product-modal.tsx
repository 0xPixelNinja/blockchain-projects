"use client";

import { useState, useEffect, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { LOGITRACK_ABI, LOGITRACK_ADDRESS } from "@/lib/contracts";
import { X, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function RegisterProductModal({ onClose }: { onClose: () => void }) {
  const [productName, setProductName] = useState("");
  const [origin, setOrigin] = useState("");
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
    if (!productName || !origin || !resolvedCid) return;
    setError("");
    writeContract({
      address: LOGITRACK_ADDRESS,
      abi: LOGITRACK_ABI,
      functionName: "registerProduct",
      args: [productName, origin, resolvedCid],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0f] border border-slate-700 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Register Product</h2>
          <p className="text-xs text-slate-500 font-mono">Single product registration on-chain</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Product Name">
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-orange-500 focus:outline-none transition-colors font-mono"
              placeholder="e.g. Organic Honey"
              disabled={isProcessing}
            />
          </Field>

          <Field label="Origin">
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-orange-500 focus:outline-none transition-colors font-mono"
              placeholder="e.g. Farm #42, Kenya"
              disabled={isProcessing}
            />
          </Field>

          <Field label="Quality Document CID">
            <div className="flex gap-2 mb-2">
              {(["manual", "upload"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setCidMode(m); setIpfsHash(""); setManualCid(""); setFile(null); }}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                    cidMode === m ? "border-orange-500 text-orange-400" : "border-slate-700 text-slate-500 hover:border-slate-500"
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
                className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-orange-500 focus:outline-none transition-colors font-mono"
                placeholder="QmXyz..."
                disabled={isProcessing}
              />
            ) : (
              <>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(e) => { setFile(e.target.files?.[0] || null); setIpfsHash(""); }} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full bg-[#050505] border border-dashed border-slate-700 text-slate-400 p-4 text-xs font-mono flex items-center justify-center gap-2 hover:border-orange-500 hover:text-orange-400 transition-colors disabled:opacity-50"
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
                  <div className="mt-2 bg-orange-900/10 border border-orange-500/30 p-3">
                    <div className="text-[9px] text-orange-400 font-bold tracking-widest mb-1">IPFS_HASH</div>
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
            disabled={isProcessing || !productName || !origin || !resolvedCid || !isConnected}
            className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
