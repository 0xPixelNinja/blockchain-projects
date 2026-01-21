"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toISOString().toUpperCase());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toISOString().toUpperCase());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <div className="h-10 bg-[#0a0a0f] border-b border-slate-800" />;

  return (
    <nav className="sticky top-0 z-50 w-full h-10 bg-[#0a0a0f] border-b border-slate-800">
      <div className="w-full max-w-7xl mx-auto h-full px-6 sm:px-12 flex items-center justify-between border-l border-r border-slate-900/50 bg-[#0a0a0f]">
        <div className="flex items-center space-x-6 text-[10px] tracking-widest font-bold">
          <Link href="/" className="flex items-center text-emerald-500 hover:text-emerald-400 no-underline">
            <div className="w-2 h-2 bg-emerald-500 mr-2 animate-pulse rounded-none"></div>
            SYSTEM ONLINE
          </Link>
          <div className="text-slate-500 hidden sm:block">LATENCY: 12MS</div>
          <div className="text-slate-500 hidden sm:block">
            ENCRYPTION: AES-256
          </div>
        </div>
        <div className="text-[10px] text-slate-400 tracking-widest">
          {currentTime}
        </div>
      </div>
    </nav>
  );
}
