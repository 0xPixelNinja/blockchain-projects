"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { useNetwork } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { isWrongNetwork, isSwitching, switchToCorrectNetwork, expectedChain } = useNetwork();

  useEffect(() => {
    setMounted(true);
  }, []);



  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  if (!mounted) {
    return (
      <Button className="gap-2" disabled>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <Button
        onClick={switchToCorrectNetwork}
        disabled={isSwitching}
        variant="destructive"
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        {isSwitching ? "Switching..." : `Switch to ${expectedChain.name}`}
      </Button>
    );
  }

  if (isConnected && address) {
    return (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <span className="sm:hidden font-mono">
              {address.slice(0, 4)}...
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Connected Wallet</span>
              <span className="font-mono text-xs">
                {address.slice(0, 10)}...{address.slice(-8)}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {balance && (
            <>
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="text-sm font-medium">
                    {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={copyAddress}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`${expectedChain.blockExplorers?.default.url}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Etherscan
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
