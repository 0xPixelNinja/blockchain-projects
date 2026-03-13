"use client";

import { useState } from "react";
import { CertificateList } from "@/components/certificate/certificate-list";
import { IssueCertificateModal } from "@/components/certificate/issue-certificate-modal";
import { Plus, Award } from "lucide-react";

export default function CertificatePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 border-l border-r border-slate-900/50 flex-grow">

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-violet-600 tracking-[0.2em] mb-4">
            <Award size={14} />
            <span>CERTIFICATE_REGISTRY_ACTIVE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
            Conference Certificates
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-violet-900/20 border border-violet-500/50 text-violet-500 px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-violet-500 hover:text-black transition-all cursor-pointer"
        >
          <Plus size={16} />
          Issue Certificate
        </button>
      </div>

      <CertificateList />

      {isModalOpen && <IssueCertificateModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
