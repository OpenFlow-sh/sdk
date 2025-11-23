"use client";

import React, { useState } from 'react';
import { useEvmAddress, useIsSignedIn, useIsInitialized } from '@coinbase/cdp-hooks';
import { createPaymentSession, executePayment } from '@/lib/payments/x402-payment';

interface Workflow {
  id: string;
  name: string;
  description: string;
  price: string; // USDC amount (e.g., "1.00")
}

interface WorkflowExecutorProps {
  workflows: Workflow[];
  onExecute: (workflowId: string, txHash: string) => Promise<void>;
}

export function WorkflowExecutor({ workflows, onExecute }: WorkflowExecutorProps) {
  const { evmAddress } = useEvmAddress();
  const { isSignedIn } = useIsSignedIn();
  const { isInitialized } = useIsInitialized();
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleExecute = async (workflow: Workflow) => {
    if (!isSignedIn || !evmAddress || !isInitialized) {
      setError('Wallet not connected. Please sign in first.');
      return;
    }

    setExecuting(workflow.id);
    setError(null);
    setTxHash(null);

    try {
      console.log(`🚀 Executing workflow: ${workflow.name}`);
      
      // Step 1: Create payment session
      const session = await createPaymentSession(evmAddress, workflow.price);
      
      // Step 2: Execute payment (automatic, no popup)
      const hash = await executePayment(evmAddress, session, workflow.price);
      setTxHash(hash);
      
      // Step 3: Execute workflow with payment proof
      await onExecute(workflow.id, hash);
      
      console.log(`✅ Workflow completed: ${workflow.name}`);
      setExecuting(null);
    } catch (err) {
      console.error('❌ Workflow execution failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setExecuting(null);
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">⏳ Initializing wallet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Available Workflows</h3>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {txHash && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm">
            ✅ Payment successful! 
            <a 
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline"
            >
              View on BaseScan →
            </a>
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
          >
            <h4 className="font-medium text-lg">{workflow.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
            
            <div className="mt-3 flex justify-between items-center">
              <div>
                <span className="text-2xl font-semibold text-blue-600">
                  ${workflow.price}
                </span>
                <span className="text-sm text-gray-500 ml-2">USDC on Base</span>
              </div>
              
              <button
                onClick={() => handleExecute(workflow)}
                disabled={executing !== null}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-colors
                  ${executing === workflow.id 
                    ? 'bg-blue-400 text-white cursor-wait' 
                    : executing !== null
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  }
                `}
              >
                {executing === workflow.id ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : (
                  '⚡ Pay & Execute'
                )}
              </button>
            </div>

            {executing === workflow.id && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Payment is automatic - no popup needed
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}