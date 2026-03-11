"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Server, Coins } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const projects = [
    {
      id: "voting",
      name: "VOTING_SYS",
      ticker: "VOTE",
      sector: "GOVERNANCE",
      tps: "ON-CHAIN",
      status: "ACTIVE",
      accent: "text-cyan-500",
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
      accent: "text-emerald-500",
      icon: <Activity className="w-6 h-6" />,
      href: "/charity",
    },
    {
      id: "token",
      name: "TOKEN_FORGE",
      ticker: "MINT",
      sector: "ERC-20 FACTORY",
      tps: "PERMISSIONLESS",
      status: "ACTIVE",
      accent: "text-amber-500",
      icon: <Coins className="w-6 h-6" />,
      href: "/token",
    },
  ];

  if (!mounted) return null;

  return (
    <div className="text-slate-200 font-mono selection:bg-white selection:text-black flex flex-col items-center">
      
      {/* --- HERO SECTION --- */}
      <header className="pt-24 pb-16 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <p className="text-blue-500 text-sm font-medium mb-4">Welcome to BlockLearn</p>

        <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
          Learning Blockchain
          <br />
          <span className="text-slate-400">By Building</span>
        </h1>

        <p className="max-w-xl text-slate-400 text-base leading-relaxed mb-8">
          A collection of blockchain projects built while learning smart contract development.
          Each project is deployed on Sepolia testnet and fully interactive.
        </p>
      </header>

      {/* --- PROJECTS SECTION --- */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-12 pb-24">
        <h2 className="text-xl font-semibold text-white mb-8">Projects</h2>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
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
