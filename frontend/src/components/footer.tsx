"use client";

import { Github } from "lucide-react";
import { config } from "@/lib/wagmi";

export function Footer() {
  const chain = config.chains[0];
  
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          {chain.name} {chain.testnet ? "(testnet)" : ""}
        </p>
        <div className="flex items-center gap-4">
          {chain.blockExplorers?.default && (
            <a
              href={chain.blockExplorers.default.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {chain.blockExplorers.default.name}
            </a>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
