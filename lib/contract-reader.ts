import { createPublicClient, http, formatUnits } from 'viem';
import { arbitrum } from 'viem/chains';

// Contract configuration
const CONTRACT_ADDRESS = "0x886495c7c0502d948ad4cb3764aeae2293664bb8";

const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "deposits",
    outputs: [
      { internalType: "address", name: "seller", type: "address" },
      { internalType: "string", name: "upiId", type: "string" },
      { internalType: "uint256", name: "remainingFunds", type: "uint256" },
      { internalType: "uint256", name: "minimumAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "buyerIntents",
    outputs: [
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "claimed", type: "bool" },
      { internalType: "uint256", name: "depositId", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "depositCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "buyer", type: "address" }],
    name: "hasActiveIntent",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cancelIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Create public client for reading from blockchain
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

export interface DepositData {
  id: string;
  depositId: string;
  seller: string;
  upiId: string;
  remainingFunds: string;
  minimumAmount: string;
  timestamp: string;
  transactionHash: string;
}

export interface IntentData {
  id: string;
  buyer: string;
  amount: string;
  timestamp: string;
  claimed: boolean;
  depositId: string;
  transactionHash: string;
}

// Read all deposits from the contract
export async function readAllDeposits(): Promise<DepositData[]> {
  try {
    // Get the total number of deposits
    const depositCounter = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'depositCounter',
    });

    const deposits: DepositData[] = [];
    
    // Read each deposit
    for (let i = 1; i <= Number(depositCounter); i++) {
      try {
        const deposit = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'deposits',
          args: [BigInt(i)],
        });

        // Only include deposits that exist (seller is not zero address)
        if (deposit[0] !== '0x0000000000000000000000000000000000000000') {
          deposits.push({
            id: i.toString(),
            depositId: i.toString(),
            seller: deposit[0],
            upiId: deposit[1],
            remainingFunds: deposit[2].toString(),
            minimumAmount: deposit[3].toString(),
            timestamp: "0", // We don't have timestamp from contract
            transactionHash: "", // We don't have tx hash from contract
          });
        }
      } catch (error) {
        // Skip deposits that don't exist or can't be read
        console.warn(`Could not read deposit ${i}:`, error);
      }
    }

    return deposits;
  } catch (error) {
    console.error('Error reading deposits from contract:', error);
    throw error;
  }
}

// Read active intent for a specific buyer
export async function readActiveIntent(buyerAddress: string): Promise<IntentData | null> {
  try {
    // First check if buyer has an active intent
    const hasActive = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'hasActiveIntent',
      args: [buyerAddress as `0x${string}`],
    });

    if (!hasActive) {
      return null;
    }

    // Read the intent details
    const intent = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'buyerIntents',
      args: [buyerAddress as `0x${string}`],
    });

    // Check if the intent is still active (not claimed and not expired)
    const isClaimed = intent[3];
    const timestamp = Number(intent[2]);
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = (currentTime - timestamp) > (24 * 60 * 60); // 24 hours

    if (isClaimed || isExpired) {
      return null;
    }

    return {
      id: `${buyerAddress}-${intent[4].toString()}`,
      buyer: intent[0],
      amount: intent[1].toString(),
      timestamp: intent[2].toString(),
      claimed: intent[3],
      depositId: intent[4].toString(),
      transactionHash: "", // We don't have tx hash from contract
    };
  } catch (error) {
    console.error('Error reading active intent:', error);
    return null;
  }
}

// Read all active intents (this is more expensive, use sparingly)
export async function readAllActiveIntents(): Promise<IntentData[]> {
  try {
    // Get all deposits first to find potential buyers
    const deposits = await readAllDeposits();
    const intents: IntentData[] = [];

    // For each deposit, we'd need to track buyers from events
    // This is complex without an indexer, so we'll use a different approach
    // We'll read intents for known addresses or use events
    
    return intents;
  } catch (error) {
    console.error('Error reading all active intents:', error);
    return [];
  }
}

// Read specific deposit by ID
export async function readDeposit(depositId: string): Promise<DepositData | null> {
  try {
    const deposit = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'deposits',
      args: [BigInt(depositId)],
    });

    // Check if deposit exists
    if (deposit[0] === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    return {
      id: depositId,
      depositId,
      seller: deposit[0],
      upiId: deposit[1],
      remainingFunds: deposit[2].toString(),
      minimumAmount: deposit[3].toString(),
      timestamp: "0", // We don't have timestamp from contract
      transactionHash: "", // We don't have tx hash from contract
    };
  } catch (error) {
    console.error(`Error reading deposit ${depositId}:`, error);
    return null;
  }
}

// Helper function to format USDC amounts
export function formatUSDCFromContract(amount: string | bigint): string {
  const num = typeof amount === 'string' ? BigInt(amount) : amount;
  const usdcAmount = Number(formatUnits(num, 6)); // USDC has 6 decimals
  return usdcAmount.toFixed(2);
}

// Helper function to check if an address has an active intent
export async function checkActiveIntent(buyerAddress: string): Promise<boolean> {
  try {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'hasActiveIntent',
      args: [buyerAddress as `0x${string}`],
    });
  } catch (error) {
    console.error('Error checking active intent:', error);
    return false;
  }
}

// Hybrid deposit data combining indexer metadata with blockchain remainingFunds
export interface HybridDepositData {
  id: string;
  depositId: string;
  seller: string;
  upiId: string;
  remainingFunds: string; // From blockchain
  minimumAmount: string; // From blockchain
  timestamp: string; // From indexer
  transactionHash: string; // From indexer
  // Additional indexer metadata
  originalAmount?: string; // Calculated from indexer events
  totalClaimed?: number; // Calculated from claims
}

// Get remaining funds for a specific deposit from blockchain
export async function getDepositRemainingFunds(depositId: string): Promise<{ remainingFunds: string; minimumAmount: string } | null> {
  try {
    const deposit = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'deposits',
      args: [BigInt(depositId)],
    });

    // Check if deposit exists
    if (deposit[0] === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    return {
      remainingFunds: deposit[2].toString(),
      minimumAmount: deposit[3].toString(),
    };
  } catch (error) {
    console.error(`Error reading deposit ${depositId} remaining funds:`, error);
    return null;
  }
}

// Get remaining funds for multiple deposits from blockchain
export async function getMultipleDepositsRemainingFunds(depositIds: string[]): Promise<Map<string, { remainingFunds: string; minimumAmount: string }>> {
  const results = new Map<string, { remainingFunds: string; minimumAmount: string }>();
  
  // Process deposits in batches to avoid overwhelming the RPC
  const batchSize = 10;
  for (let i = 0; i < depositIds.length; i += batchSize) {
    const batch = depositIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (depositId) => {
      const data = await getDepositRemainingFunds(depositId);
      if (data) {
        results.set(depositId, data);
      }
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
}
