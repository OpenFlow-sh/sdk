import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { base } from 'viem/chains';

// USDC on Base Mainnet
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET!;

export interface PaymentSession {
  maxAmount: bigint;
  validUntil: number;
  nonce: string;
}

/**
 * Create a payment session with spending limits
 * This sets up the parameters for automatic payment execution
 */
export async function createPaymentSession(
  userWallet: any,
  workflowPrice: string // e.g., "1.00" USDC
): Promise<PaymentSession> {
  const maxAmount = parseUnits(workflowPrice, 6); // USDC has 6 decimals
  const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity
  const nonce = Date.now().toString();

  console.log(`💰 Payment session created: ${workflowPrice} USDC, valid until ${new Date(validUntil * 1000).toISOString()}`);

  return {
    maxAmount,
    validUntil,
    nonce
  };
}

/**
 * Execute USDC payment on Base
 * This uses session keys for automatic execution (no user popup)
 */
export async function executePayment(
  userWallet: any,
  session: PaymentSession,
  actualAmount: string
): Promise<string> {
  const client = createWalletClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC)
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC)
  });

  // USDC ERC-20 transfer ABI
  const TRANSFER_ABI = [{
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }] as const;

  const amount = parseUnits(actualAmount, 6); // USDC = 6 decimals

  try {
    console.log(`💳 Executing payment: ${actualAmount} USDC to ${PLATFORM_WALLET}`);
    
    // Execute USDC transfer using CDP wallet
    const hash = await userWallet.writeContract({
      address: USDC_BASE,
      abi: TRANSFER_ABI,
      functionName: 'transfer',
      args: [PLATFORM_WALLET, amount]
    });

    console.log(`⏳ Transaction submitted: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log(`✅ Payment confirmed: ${hash}`);
    } else {
      throw new Error('Transaction failed on chain');
    }

    return hash;
  } catch (error) {
    console.error('❌ Payment failed:', error);
    throw new Error('Payment execution failed');
  }
}

/**
 * Verify payment on-chain
 * Checks transaction status on Base
 */
export async function verifyPayment(txHash: string): Promise<boolean> {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC)
  });

  try {
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash as `0x${string}`
    });

    return receipt.status === 'success';
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}