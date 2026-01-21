"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Activity,
  Terminal,
  Wifi,
  ChevronRight,
  Server,
  Lock,
} from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toISOString().toUpperCase());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toISOString().toUpperCase());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const projects = [
    {
      id: "voting",
      name: "VOTING_SYS",
      ticker: "VOTE",
      sector: "GOVERNANCE",
      tps: "ON-CHAIN",
      status: "ACTIVE",
      security: "AUDITED",
      accent: "text-cyan-500",
      border: "border-cyan-500",
      bg: "hover:bg-cyan-950",
      icon: <Server className="w-6 h-6" />,
      href: "/voting",
    },
    {
      id: "charity",
      name: "CHARITY_LEDGER",
      ticker: "GIVE",
      sector: "PUBLIC GOOD",
      tps: "TRANSPARENT",
      status: "ONLINE",
      security: "VERIFIED",
      accent: "text-emerald-500",
      border: "border-emerald-500",
      bg: "hover:bg-emerald-950",
      icon: <Activity className="w-6 h-6" />,
      href: "/charity",
    },
  ];

  // Only show projects that match the active tab
  const filteredProjects = projects.filter((project) => {
    if (activeTab === "ALL") return true;
    return project.sector === activeTab;
  });

  const categories = ["ALL", "GOVERNANCE", "PUBLIC GOOD"];

  if (!mounted) return null;

  return (
    <div className="text-slate-200 font-mono selection:bg-white selection:text-black flex flex-col items-center">
      
      {/* --- HERO SECTION --- */}
      <header className="pt-24 pb-16 px-6 sm:px-12 max-w-7xl mx-auto w-full border-l border-r border-slate-900/50 relative">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-slate-600"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-600"></div>

        <div className="mb-4 flex items-center space-x-2 text-xs font-bold text-blue-600 tracking-[0.2em]">
          <Terminal size={14} />
          <span>TERMINAL_ACCESS_GRANTED</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9] mb-8">
          Blockchain
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-500 to-white">
            Infrastucture
          </span>
        </h1>

        <p className="max-w-xl text-slate-400 text-sm leading-relaxed border-l-2 border-blue-600 pl-4 mb-10">
          Deployed smart contract systems on Sepolia Testnet. Interactive
          interfaces for Voting and Charity Tracking. Zero latency interactions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button className="bg-blue-600 text-black font-bold px-8 py-4 text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-none duration-0 active:translate-y-1">
            Initialize Scan
          </button>
          <button className="cursor-pointer bg-transparent border border-slate-700 text-slate-300 font-bold px-8 py-4 text-xs tracking-widest uppercase hover:bg-slate-800 transition-none duration-0 flex items-center gap-2">
            <Lock size={12} />
            Connect Wallet
          </button>
        </div>
      </header>

      {/* --- DASHBOARD GRID --- */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-12 pb-24 border-l border-r border-slate-900/50">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-px bg-slate-900 mb-12 border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex-grow px-6 py-3 text-xs font-bold tracking-widest uppercase transition-none duration-0
                ${
                  activeTab === cat
                    ? "bg-blue-600 text-black"
                    : "bg-[#0a0a0f] text-slate-500 hover:text-white hover:bg-slate-800"
                }`}
            >
              [{cat}]
            </button>
          ))}
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              href={project.href}
              key={project.id}
              className={`
                group relative bg-[#0a0a0f] border-2 border-slate-800 p-6 flex flex-col justify-between h-72
                transition-none duration-0 hover:border-white cursor-pointer
              `}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-none duration-0">
                <div
                  className={`w-2 h-2 ${project.accent.replace(
                    "text-",
                    "bg-"
                  )}`}
                ></div>
              </div>

              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-2 bg-slate-900 text-white group-hover:bg-white group-hover:text-black transition-none duration-0`}
                  >
                    {project.icon}
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold tracking-widest">
                    ID_{project.id}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white mb-1 tracking-tight">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-2 mb-6">
                  <span
                    className={`text-[10px] font-bold px-1 py-0.5 bg-slate-900 ${project.accent}`}
                  >
                    {project.ticker}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                    // {project.sector}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800">
                <div className="bg-[#0a0a0f] p-2">
                  <div className="text-[9px] text-slate-500 mb-1">
                    THROUGHPUT
                  </div>
                  <div className="text-xs font-bold text-white">
                    {project.tps}
                  </div>
                </div>
                <div className="bg-[#0a0a0f] p-2">
                  <div className="text-[9px] text-slate-500 mb-1">STATUS</div>
                  <div className={`text-xs font-bold ${project.accent}`}>
                    {project.status}
                  </div>
                </div>
              </div>

              {/* Hover Overlay Line */}
              <div
                className={`absolute bottom-0 left-0 h-1 transition-all duration-0 ${
                  hoveredProject === project.id
                    ? "w-full " + project.accent.replace("text-", "bg-")
                    : "w-0 bg-transparent"
                }`}
              ></div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
