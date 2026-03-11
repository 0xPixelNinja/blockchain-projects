"use client";

import { use, useState } from "react";
import { useReadContract, useReadContracts, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { TOKEN_TEMPLATE_ABI } from "@/lib/contracts";
import { formatUnits, parseUnits, isAddress } from "viem";
import { ArrowLeft, Coins, Send, ExternalLink, Copy, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function TokenDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address: tokenAddress } = use(params);
  const { address: userAddress } = useAccount();
  const [copied, setCopied] = useState(false);

  const validAddress = isAddress(tokenAddress) ? tokenAddress as `0x${string}` : undefined;

  const { data: results } = useReadContracts({
    contracts: validAddress ? [
      { address: validAddress, abi: TOKEN_TEMPLATE_ABI, functionName: "name" },
      { address: validAddress, abi: TOKEN_TEMPLATE_ABI, functionName: "symbol" },
      { address: validAddress, abi: TOKEN_TEMPLATE_ABI, functionName: "totalSupply" },
      { address: validAddress, abi: TOKEN_TEMPLATE_ABI, functionName: "creator" },
      { address: validAddress, abi: TOKEN_TEMPLATE_ABI, functionName: "decimals" },
    ] : [],
  });

  const { data: userBalance } = useReadContract({
    address: validAddress,
    abi: TOKEN_TEMPLATE_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!validAddress },
  });

  if (!validAddress) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 border-l border-r border-slate-900/50 grow">
        <p className="text-red-500 font-mono text-sm">INVALID_TOKEN_ADDRESS</p>
        <Link href="/token" className="text-amber-500 text-xs font-mono hover:underline mt-4 inline-block">
          &larr; BACK_TO_REGISTRY
        </Link>
      </div>
    );
  }

  const isLoaded = results && results.every((r) => r.status === "success");
  const name = results?.[0]?.result as string | undefined;
  const symbol = results?.[1]?.result as string | undefined;
  const totalSupply = results?.[2]?.result as bigint | undefined;
  const creator = results?.[3]?.result as string | undefined;
  const decimals = (results?.[4]?.result as number | undefined) ?? 18;

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 border-l border-r border-slate-900/50 grow">

      {/* Back Link */}
      <Link href="/token" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-amber-500 mb-8 transition-colors">
        <ArrowLeft size={14} />
        BACK_TO_REGISTRY
      </Link>

      {!isLoaded ? (
        <div className="animate-pulse text-xs font-mono text-slate-500">LOADING_TOKEN_DATA...</div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500 text-black">
                  <Coins size={20} />
                </div>
                <span className="text-xs font-bold text-amber-500 tracking-[0.2em]">{symbol}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">
                {name}
              </h1>
            </div>
            <a
              href={`https://sepolia.etherscan.io/address/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-mono text-amber-600 hover:text-amber-400 transition-colors"
            >
              <ExternalLink size={12} />
              VIEW ON ETHERSCAN
            </a>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800 border border-slate-800 mb-10">
            <div className="bg-[#0a0a0f] p-4">
              <div className="text-[9px] text-slate-500 tracking-widest mb-2">CONTRACT</div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white">{truncate(tokenAddress)}</span>
                <button onClick={() => copyToClipboard(tokenAddress)} className="text-slate-600 hover:text-amber-500 transition-colors">
                  {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            <div className="bg-[#0a0a0f] p-4">
              <div className="text-[9px] text-slate-500 tracking-widest mb-2">TOTAL_SUPPLY</div>
              <div className="text-xs font-bold text-white">
                {totalSupply !== undefined ? Number(formatUnits(totalSupply, decimals)).toLocaleString() : "0"}{" "}
                <span className="text-amber-500">{symbol}</span>
              </div>
            </div>
            <div className="bg-[#0a0a0f] p-4">
              <div className="text-[9px] text-slate-500 tracking-widest mb-2">DECIMALS</div>
              <div className="text-xs font-bold text-white">{decimals}</div>
            </div>
            <div className="bg-[#0a0a0f] p-4">
              <div className="text-[9px] text-slate-500 tracking-widest mb-2">CREATOR</div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://sepolia.etherscan.io/address/${creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-amber-600 hover:text-amber-400"
                >
                  {creator ? truncate(creator) : "..."}
                </a>
              </div>
            </div>
          </div>

          {/* Your Balance */}
          {userAddress && (
            <div className="bg-[#0a0a0f] border border-slate-800 p-6 mb-10">
              <div className="text-[9px] text-slate-500 tracking-widest mb-2">YOUR_BALANCE</div>
              <div className="text-2xl font-black text-white">
                {userBalance !== undefined ? Number(formatUnits(userBalance, decimals)).toLocaleString() : "0"}{" "}
                <span className="text-amber-500 text-sm">{symbol}</span>
              </div>
            </div>
          )}

          {/* Transfer Section */}
          {userAddress && userBalance !== undefined && userBalance > BigInt(0) && (
            <TransferForm
              tokenAddress={validAddress}
              symbol={symbol || "???"}
              decimals={decimals}
              balance={userBalance}
            />
          )}
        </>
      )}
    </div>
  );
}

function TransferForm({
  tokenAddress,
  symbol,
  decimals,
  balance,
}: {
  tokenAddress: `0x${string}`;
  symbol: string;
  decimals: number;
  balance: bigint;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const { data: hash, writeContract, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !amount || !isAddress(to) || Number(amount) <= 0) return;

    const parsedAmount = parseUnits(amount, decimals);
    if (parsedAmount > balance) return;

    writeContract({
      address: tokenAddress,
      abi: TOKEN_TEMPLATE_ABI,
      functionName: "transfer",
      args: [to as `0x${string}`, parsedAmount],
    });
  };

  const setMaxAmount = () => {
    setAmount(formatUnits(balance, decimals));
  };

  return (
    <div className="bg-[#0a0a0f] border border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Send size={16} className="text-amber-500" />
        <h2 className="text-sm font-black text-white uppercase tracking-wider">Transfer Tokens</h2>
      </div>

      {isSuccess ? (
        <div className="text-center py-8">
          <CheckCircle size={32} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-white mb-2">TRANSFER_COMPLETE</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-amber-600 hover:text-amber-400"
          >
            VIEW TRANSACTION &rarr;
          </a>
          <button
            onClick={() => { reset(); setTo(""); setAmount(""); }}
            className="block mx-auto mt-4 text-xs text-slate-500 hover:text-white transition-colors"
          >
            SEND_ANOTHER
          </button>
        </div>
      ) : (
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono"
              placeholder="0x..."
            />
            {to && !isAddress(to) && (
              <p className="text-[9px] text-red-500 mt-1 font-mono">INVALID_ADDRESS</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Amount
              </label>
              <button
                type="button"
                onClick={setMaxAmount}
                className="text-[9px] text-amber-600 hover:text-amber-400 font-bold tracking-widest"
              >
                MAX
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              className="w-full bg-[#050505] border border-slate-800 text-white p-3 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono"
              placeholder="0.0"
            />
            <p className="text-[9px] text-slate-600 mt-1 font-mono">
              AVAILABLE: {Number(formatUnits(balance, decimals)).toLocaleString()} {symbol}
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming || !to || !amount}
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(isPending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Confirming..." : isConfirming ? "Sending..." : "Send Tokens"}
          </button>
        </form>
      )}
    </div>
  );
}
