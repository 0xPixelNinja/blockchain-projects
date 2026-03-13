"use client";

import { useState, useEffect, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CERTIFICATE_ABI, CERTIFICATE_ADDRESS } from "@/lib/contracts";
import { X, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function IssueCertificateModal({ onClose }: { onClose: () => void }) {
  const [studentName, setStudentName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pinata", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      setIpfsHash(data.ipfsHash);
    } catch {
      setError("Network error during upload");
    }

    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !ipfsHash) return;
    setError("");

    writeContract({
      address: CERTIFICATE_ADDRESS,
      abi: CERTIFICATE_ABI,
      functionName: "issueCertificate",
      args: [studentName, ipfsHash],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      onClose();
      router.refresh();
    }
  }, [isSuccess, onClose, router]);

  useEffect(() => {
    if (writeError) {
      setError(writeError.message.split("\n")[0]);
    }
  }, [writeError]);

  const isProcessing = uploading || isPending || isConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0f] border border-slate-700 p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Issue Certificate</h2>
          <p className="text-xs text-slate-500 font-mono">UPLOAD TO IPFS + REGISTER ON LEDGER</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Student Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-violet-500 focus:outline-none transition-colors font-mono"
              placeholder="ENTER_NAME"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Certificate File (Image / PDF)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setIpfsHash("");
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-[#050505] border border-dashed border-slate-700 text-slate-400 p-4 text-xs font-mono flex items-center justify-center gap-2 hover:border-violet-500 hover:text-violet-400 transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              {file ? file.name : "SELECT_FILE"}
            </button>
          </div>

          {file && !ipfsHash && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-slate-900 border border-slate-700 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading to IPFS..." : "Upload to IPFS"}
            </button>
          )}

          {ipfsHash && (
            <div className="bg-violet-900/10 border border-violet-500/30 p-3">
              <div className="text-[9px] text-violet-400 font-bold tracking-widest mb-1">IPFS_HASH</div>
              <div className="text-xs font-mono text-white break-all">{ipfsHash}</div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/10 border border-red-500/30 p-3">
              <div className="text-xs font-mono text-red-400">{error}</div>
            </div>
          )}

          {!isConnected && (
            <div className="bg-yellow-900/10 border border-yellow-500/30 p-3">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1">Wallet Not Connected</div>
              <div className="text-xs font-mono text-yellow-300/70">Connect your wallet to register this certificate on the blockchain.</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || !studentName || !ipfsHash || !isConnected}
            className="w-full bg-violet-600 hover:bg-violet-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(isPending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Confirming..." : isConfirming ? "Registering..." : "Register on Blockchain"}
          </button>
        </form>
      </div>
    </div>
  );
}
