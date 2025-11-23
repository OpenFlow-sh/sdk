"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { AuthButton } from '@coinbase/cdp-react';
import { useRouter } from 'next/navigation';
import { WalletInfo } from '@/components/wallet/WalletInfo';
import { useCurrentUser, useEvmAddress, useIsSignedIn } from '@coinbase/cdp-hooks';

export default function CoinbaseAuthPage() {
  const router = useRouter();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync user with Onyx backend after CDP authentication
  useEffect(() => {
    if (isSignedIn && currentUser && evmAddress && !isSyncing) {
      syncWithBackend();
    }
  }, [isSignedIn, currentUser, evmAddress]);

  const syncWithBackend = async () => {
    if (!currentUser || !evmAddress) return;
    
    setIsSyncing(true);
    setSyncError(null);

    try {
      console.log('🔄 Syncing Coinbase user with Onyx backend...');
      
      // Type assertion for CDP user data
      const cdpUser = currentUser as any;
      
      const response = await fetch('/api/auth/coinbase-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cdpUser.email || cdpUser.emailAddress || '',
          coinbaseUserId: cdpUser.id || cdpUser.userId || '',
          walletAddress: evmAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const data = await response.json();
      console.log('✅ User synced successfully:', data.user);
      
      // Redirect to chat
      router.push('/chat');
    } catch (error: any) {
      console.error('❌ Sync error:', error);
      setSyncError(error.message || 'Failed to sync user. Please try again.');
      setIsSyncing(false);
    }
  };

  // Handle authentication errors
  const handleError = useCallback((error: unknown) => {
    console.error('❌ Coinbase authentication error:', error);
    setSyncError('Authentication failed. Please try again.');
  }, []);

  // If syncing, show loading state
  if (isSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Syncing Your Account
            </h1>
            <p className="text-gray-600">
              Creating your Onyx account with Coinbase wallet...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated and synced, show success
  if (isSignedIn && currentUser && evmAddress && !isSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              You're Signed In!
            </h1>
            <p className="text-gray-600 mb-6">
              Your Coinbase wallet is ready
            </p>
          </div>

          {/* Show wallet info */}
          <div className="flex justify-center">
            <WalletInfo />
          </div>

          {/* Go to chat button */}
          <button
            onClick={() => router.push('/chat')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Go to Chat →
          </button>
        </div>
      </div>
    );
  }

  // Show error if sync failed
  if (syncError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sync Failed
            </h1>
            <p className="text-red-600 mb-6">
              {syncError}
            </p>
          </div>
          <button
            onClick={() => {
              setSyncError(null);
              syncWithBackend();
            }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Use Email/Password Instead
          </button>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="text-5xl mb-4">🪙</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Openflow
          </h1>
          <p className="text-gray-600">
            AI Workflow Platform with Crypto Payments
          </p>
        </div>

        {/* Coinbase Auth Button */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-6">
              Sign in with your Coinbase wallet
            </p>
            
            {/* This is the official Coinbase UI component */}
            <div className="flex justify-center">
              <AuthButton onError={handleError} />
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-3 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              What you get:
            </h3>
            <div className="flex items-start text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Automatic wallet creation - no setup required</span>
            </div>
            <div className="flex items-start text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No seed phrases to backup or lose</span>
            </div>
            <div className="flex items-start text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Pay for AI workflows with USDC on Base</span>
            </div>
            <div className="flex items-start text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure by Coinbase - trusted by millions</span>
            </div>
          </div>

          {/* Alternative login */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">
              Or use traditional login
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in with email →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-6 pt-6 border-t">
          <p>Powered by Coinbase CDP</p>
        </div>
      </div>
    </div>
  );
}