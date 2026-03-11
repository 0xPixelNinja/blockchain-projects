"use client";

import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { TOKEN_FACTORY_ABI, TOKEN_FACTORY_ADDRESS, TOKEN_TEMPLATE_ABI } from "@/lib/contracts";
import { Coins } from "lucide-react";
import { formatUnits } from "viem";
import Link from "next/link";

export function TokenList({ showMyTokens }: { showMyTokens?: boolean }) {
  const { address: userAddress } = useAccount();

  const { data: allTokens, isLoading: loadingAll } = useReadContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TOKEN_FACTORY_ABI,
    functionName: "getDeployedTokens",
  });

  const { data: myTokens, isLoading: loadingMy } = useReadContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TOKEN_FACTORY_ABI,
    functionName: "getTokensByCreator",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!showMyTokens && !!userAddress },
  });

  const isLoading = showMyTokens ? loadingMy : loadingAll;
  const tokenAddresses = showMyTokens ? myTokens : allTokens;

  if (isLoading) {
    return <div className="animate-pulse text-xs font-mono text-slate-500">SCANNING_REGISTRY...</div>;
  }

  if (!tokenAddresses || tokenAddresses.length === 0) {
    return <div className="text-slate-500 font-mono text-xs">{showMyTokens ? "NO_TOKENS_CREATED_BY_YOU" : "NO_TOKENS_DEPLOYED_YET"}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...tokenAddresses].reverse().map((addr) => (
        <TokenCard key={addr} address={addr} />
      ))}
    </div>
  );
}

function TokenCard({ address }: { address: `0x${string}` }) {
  const { data: results } = useReadContracts({
    contracts: [
      { address, abi: TOKEN_TEMPLATE_ABI, functionName: "name" },
      { address, abi: TOKEN_TEMPLATE_ABI, functionName: "symbol" },
      { address, abi: TOKEN_TEMPLATE_ABI, functionName: "totalSupply" },
      { address, abi: TOKEN_TEMPLATE_ABI, functionName: "creator" },
    ],
  });

  if (!results || results.some((r) => r.status !== "success")) {
    return <div className="h-48 bg-[#0a0a0f] animate-pulse border border-slate-800" />;
  }

  const name = results[0].result as string | undefined;
  const symbol = results[1].result as string | undefined;
  const totalSupply = results[2].result as bigint | undefined;
  const creator = results[3].result as string | undefined;

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <Link
      href={`/token/${address}`}
      className="group bg-[#0a0a0f] border-2 border-slate-800 p-6 hover:border-amber-500 transition-none duration-0 flex flex-col justify-between no-underline"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-900 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
            <Coins size={20} />
          </div>
          <span className="text-[10px] text-slate-600 font-bold tracking-widest">
            {symbol || "???"}
          </span>
        </div>

        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight line-clamp-2">
          {name || "Unknown Token"}
        </h3>

        <div className="text-xs font-mono text-slate-400 mb-1">
          Creator: {creator ? truncate(creator) : "..."}
        </div>
        <div className="text-[10px] font-mono text-amber-600 break-all">
          {truncate(address)}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-3 mt-4">
        <div className="text-[9px] text-slate-500 mb-1 tracking-widest">TOTAL_SUPPLY</div>
        <div className="text-lg font-bold text-white flex items-baseline gap-1">
          {totalSupply !== undefined ? Number(formatUnits(totalSupply, 18)).toLocaleString() : "0"}{" "}
          <span className="text-xs text-amber-500">{symbol || "???"}</span>
        </div>
      </div>
    </Link>
  );
}
