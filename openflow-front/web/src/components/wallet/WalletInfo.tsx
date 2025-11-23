"use client";

import React, { useEffect, useState } from 'react';
import { useEvmAddress, useIsSignedIn } from '@coinbase/cdp-hooks';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const USDC_ABI = [{
  name: 'balanceOf',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }]
}] as const;

export function WalletInfo() {
  const { evmAddress } = useEvmAddress();
  const { isSignedIn } = useIsSignedIn();
  const [balance, setBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || !evmAddress) {
      setIsLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(process.env.NEXT_PUBLIC_BASE_RPC)
        });

        const balance = await publicClient.readContract({
          address: USDC_BASE,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [evmAddress]
        });

        setBalance(formatUnits(balance, 6));
      } catch (err) {
        console.error('Error fetching balance:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn, evmAddress]);

  if (!isSignedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin">⏳</div>
        <span className="text-sm text-gray-600">Loading wallet...</span>
      </div>
    );
  }

  if (!evmAddress) {
    return null;
  }

  const shortAddress = `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-gray-700">Connected</span>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-blue-100">
        <span className="text-sm font-bold text-blue-600">{parseFloat(balance).toFixed(2)}</span>
        <span className="text-xs text-gray-500">USDC</span>
      </div>

      {/* Address */}
      <a
        href={`https://basescan.org/address/${evmAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
        title="View on BaseScan"
      >
        <span>📍</span>
        <span className="font-mono">{shortAddress}</span>
        <span className="text-[10px]">↗</span>
      </a>
    </div>
  );
}