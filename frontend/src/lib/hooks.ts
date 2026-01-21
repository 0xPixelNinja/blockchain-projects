"use client";

import { useChainId, useAccount, useSwitchChain } from "wagmi";
import { config } from "@/lib/wagmi";

/**
 * Hook to check network status and provide switch functionality
 * Uses the first chain from wagmi config as the expected chain
 */
export function useNetwork() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const expectedChain = config.chains[0];
  const isCorrectNetwork = chainId === expectedChain.id;
  const isWrongNetwork = isConnected && !isCorrectNetwork;

  const switchToCorrectNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: expectedChain.id });
    }
  };

  return {
    chainId,
    isCorrectNetwork,
    isWrongNetwork,
    isSwitching,
    switchToCorrectNetwork,
    expectedChain,
  };
}
