"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CDPReactProvider, type Config } from '@coinbase/cdp-react';

interface CDPContextType {
  wallet: any | null;
  isInitialized: boolean;
  error: string | null;
}

const CDPContext = createContext<CDPContextType>({
  wallet: null,
  isInitialized: false,
  error: null
});

export const useCDP = () => useContext(CDPContext);

interface CDPProviderProps {
  children: React.ReactNode;
  user: any; // User from Onyx auth
}

export function CDPProvider({ children, user }: CDPProviderProps) {
  const [wallet, setWallet] = useState<any | null>(null);
  const [isInitialized, setIsInitialized] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure CDP - no JWT needed for basic auth
  const cdpConfig: Config = {
    projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID!,
    // Enable ALL available authentication methods
    authMethods: [
      'email',           // Email OTP
      'sms',             // SMS OTP
      'oauth:google',    // Google OAuth
      'oauth:apple',     // Apple OAuth
      'oauth:x'          // X (Twitter) OAuth
    ],
    ethereum: {
      createOnLogin: 'eoa' // Create EVM account on login
    },
    appName: 'Openflow',
    appLogoUrl: '/onyx.ico', // Your app logo
    basePath: 'https://api.cdp.coinbase.com',
    useMock: false,
    debugging: true // Enable for development
  };

  return (
    <CDPReactProvider config={cdpConfig}>
      <CDPContext.Provider value={{ wallet, isInitialized, error }}>
        {children}
      </CDPContext.Provider>
    </CDPReactProvider>
  );
}