import { Terminal } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#050505] border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 flex items-center justify-center">
              <Terminal size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">BlockLearn</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Etherscan
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          Built for learning. Deployed on Sepolia Testnet.
        </div>
      </div>
    </footer>
  );
}
