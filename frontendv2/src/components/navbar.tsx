"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Terminal, ChevronDown, Copy, LogOut, ExternalLink, Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { formatUnits } from "viem";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().slice(0, 19).replace("T", " "));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const openEtherscan = () => {
    if (address) {
      window.open(`https://sepolia.etherscan.io/address/${address}`, "_blank");
    }
  };

  if (!mounted) return <div className="h-12 bg-[#0a0a0f] border-b border-slate-800" />;

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0a0a0f] border-b border-slate-800">
      <div className="w-full max-w-7xl mx-auto h-12 px-4 sm:px-8 flex items-center justify-between">
        
        {/* LEFT: Brand */}
        <Link href="/" className="flex items-center gap-2 group no-underline">
          <div className="w-7 h-7 bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
            <Terminal size={14} className="text-emerald-500" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black text-white tracking-wider">BLACKBOX</div>
            <div className="text-[8px] text-slate-500 tracking-widest -mt-0.5">SYSTEMS</div>
          </div>
        </Link>

        {/* RIGHT: Date + Wallet */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Date/Time - Compact */}
          <div className="hidden sm:flex flex-col items-end text-[9px] tracking-wider">
            <span className="text-slate-500">{currentTime.split(" ")[0]}</span>
            <span className="text-slate-600">{currentTime.split(" ")[1]} UTC</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-slate-800"></div>

          {/* Wallet Section */}
          {isConnected && address ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 hover:border-slate-600 transition-colors"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono text-white">{truncateAddress(address)}</span>
                <ChevronDown size={12} className={`text-slate-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0f] border border-slate-700 shadow-xl shadow-black/50">
                  {/* Balance */}
                  <div className="p-3 border-b border-slate-800">
                    <div className="text-[9px] text-slate-500 tracking-widest mb-1">BALANCE</div>
                    <div className="text-sm font-mono text-white">
                      {balance ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : "0.0000 ETH"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1">
                    <button
                      onClick={copyAddress}
                      className="w-full flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Copy size={12} />
                      <span>COPY ADDRESS</span>
                    </button>
                    <button
                      onClick={openEtherscan}
                      className="w-full flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>VIEW ON ETHERSCAN</span>
                    </button>
                    <div className="border-t border-slate-800 my-1"></div>
                    <button
                      onClick={() => { disconnect(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-[10px] text-red-500 hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={12} />
                      <span>DISCONNECT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 transition-colors"
            >
              <Wallet size={12} className="text-black" />
              <span className="text-[10px] font-bold text-black tracking-wider">CONNECT</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
