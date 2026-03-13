"use client";

import { useReadContract, useAccount } from "wagmi";
import { CERTIFICATE_ABI, CERTIFICATE_ADDRESS } from "@/lib/contracts";
import { Award, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CertificateList() {
  const { address } = useAccount();
  const [searchId, setSearchId] = useState("");
  const [showMine, setShowMine] = useState(false);
  const router = useRouter();

  const { data: certificateCount, isLoading } = useReadContract({
    address: CERTIFICATE_ADDRESS,
    abi: CERTIFICATE_ABI,
    functionName: "certificateCount",
  });

  const { data: myCertIds } = useReadContract({
    address: CERTIFICATE_ADDRESS,
    abi: CERTIFICATE_ABI,
    functionName: "getCertificatesByIssuer",
    args: address ? [address] : undefined,
    query: { enabled: !!address && showMine },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(searchId);
    if (!isNaN(id)) {
      router.push(`/certificate/${id}`);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-xs font-mono text-slate-500">SCANNING_REGISTRY...</div>;
  }

  const count = Number(certificateCount || 0);
  const startId = 1001;

  const displayIds = showMine && myCertIds
    ? [...myCertIds].map(Number).reverse()
    : count > 0
      ? Array.from({ length: count }, (_, i) => startId + count - 1 - i)
      : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="ENTER_CERT_ID"
              className="bg-[#050505] border border-slate-800 text-white pl-9 pr-4 py-2 text-xs focus:border-violet-500 focus:outline-none font-mono w-48"
            />
          </div>
          <button
            type="submit"
            className="bg-violet-900/30 border border-violet-500/50 text-violet-400 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-violet-500 hover:text-black transition-all"
          >
            Verify
          </button>
        </form>

        {address && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMine(false)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border ${
                !showMine ? "border-violet-500 text-violet-400 bg-violet-900/20" : "border-slate-800 text-slate-500 hover:text-white"
              }`}
            >
              All Certs
            </button>
            <button
              onClick={() => setShowMine(true)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border ${
                showMine ? "border-violet-500 text-violet-400 bg-violet-900/20" : "border-slate-800 text-slate-500 hover:text-white"
              }`}
            >
              My Issued
            </button>
          </div>
        )}
      </div>

      {displayIds.length === 0 ? (
        <div className="text-slate-500 font-mono text-xs">NO_CERTIFICATES_FOUND</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayIds.map((id) => (
            <CertificateCard key={id} id={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertificateCard({ id }: { id: number }) {
  const { data: cert } = useReadContract({
    address: CERTIFICATE_ADDRESS,
    abi: CERTIFICATE_ABI,
    functionName: "getCertificate",
    args: [BigInt(id)],
  });

  if (!cert) return <div className="h-48 bg-[#0a0a0f] animate-pulse border border-slate-800" />;

  return (
    <Link
      href={`/certificate/${id}`}
      className="group block bg-[#0a0a0f] border-2 border-slate-800 p-6 hover:border-violet-500 transition-none duration-0 cursor-pointer h-full flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-900 text-violet-500 group-hover:bg-violet-500 group-hover:text-black transition-colors">
            <Award size={20} />
          </div>
          <span className="text-[10px] text-slate-600 font-bold tracking-widest">
            CERT_{String(id)}
          </span>
        </div>

        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight line-clamp-2">
          {cert.studentName}
        </h3>

        <div className="text-xs font-mono text-slate-400 mb-2 break-all">
          ISSUER: {cert.issuer.slice(0, 6)}...{cert.issuer.slice(-4)}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-3 mt-4">
        <div className="text-[9px] text-slate-500 mb-1 tracking-widest">ISSUED_AT</div>
        <div className="text-xs font-mono text-white">
          {new Date(Number(cert.issuedAt) * 1000).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
