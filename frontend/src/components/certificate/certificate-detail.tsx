"use client";

import { useReadContract } from "wagmi";
import { CERTIFICATE_ABI, CERTIFICATE_ADDRESS } from "@/lib/contracts";
import { Award, ExternalLink, User, Calendar, Hash, FileCheck } from "lucide-react";

const GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";

export function CertificateDetail({ id }: { id: number }) {
  const { data: verification, isLoading } = useReadContract({
    address: CERTIFICATE_ADDRESS,
    abi: CERTIFICATE_ABI,
    functionName: "verifyCertificate",
    args: [BigInt(id)],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <div className="h-64 bg-[#0a0a0f] border border-slate-800" />
        <div className="lg:col-span-2 h-64 bg-[#0a0a0f] border border-slate-800" />
      </div>
    );
  }

  if (!verification || !verification[0]) {
    return (
      <div className="bg-[#0a0a0f] border-2 border-red-900/50 p-12 text-center">
        <div className="text-red-500 text-xs font-bold tracking-widest mb-4">VERIFICATION_FAILED</div>
        <div className="text-3xl font-black text-white mb-2">Certificate Not Found</div>
        <div className="text-sm text-slate-500 font-mono">ID #{id} does not exist on the ledger</div>
      </div>
    );
  }

  const [, studentName, ipfsHash, issuer, issuedAt] = verification;
  const ipfsUrl = `${GATEWAY_URL}/${ipfsHash}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-6">
        <div className="bg-[#0a0a0f] border-2 border-slate-800 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award size={120} className="text-violet-500" />
          </div>

          <div className="bg-violet-900/20 border border-violet-500/30 px-3 py-2 inline-flex items-center gap-2 mb-6">
            <FileCheck size={14} className="text-violet-400" />
            <span className="text-[10px] font-bold text-violet-400 tracking-widest">VERIFIED_ON_CHAIN</span>
          </div>

          <div className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">CERTIFICATE_ID</div>
          <h1 className="text-4xl font-mono font-bold text-white tracking-tighter mb-6 relative z-10">
            #{id}
          </h1>

          <div className="space-y-5">
            <div>
              <div className="text-[10px] text-violet-500 font-bold tracking-widest mb-1 flex items-center gap-1">
                <User size={10} /> RECIPIENT
              </div>
              <div className="text-xl font-black text-white uppercase break-words">
                {studentName}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-violet-500 font-bold tracking-widest mb-1 flex items-center gap-1">
                <Hash size={10} /> ISSUER
              </div>
              <div className="text-xs font-mono text-slate-400 break-all">
                {issuer}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-violet-500 font-bold tracking-widest mb-1 flex items-center gap-1">
                <Calendar size={10} /> ISSUED_AT
              </div>
              <div className="text-sm font-mono text-white">
                {new Date(Number(issuedAt) * 1000).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0f] border-2 border-slate-800 p-6">
          <div className="text-[10px] text-slate-500 font-bold tracking-widest mb-3">IPFS_HASH</div>
          <div className="text-xs font-mono text-slate-400 break-all mb-4">
            {ipfsHash}
          </div>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-violet-900/30 text-violet-400 border border-violet-500/50 p-3 text-xs font-bold uppercase tracking-widest hover:bg-violet-500 hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} />
            View Certificate on IPFS
          </a>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-[#0a0a0f] border-2 border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/30">
            <span className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
              <Award size={14} /> CERTIFICATE_PREVIEW
            </span>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[500px] bg-[#050505]">
            <img
              src={ipfsUrl}
              alt={`Certificate for ${studentName}`}
              className="max-w-full max-h-[600px] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className = "text-center space-y-4";
                  fallback.innerHTML = `
                    <div class="text-slate-500 text-xs font-mono">PREVIEW_UNAVAILABLE</div>
                    <a href="${ipfsUrl}" target="_blank" rel="noopener noreferrer" class="text-violet-400 text-xs font-bold hover:text-violet-300 underline">Open file directly</a>
                  `;
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
