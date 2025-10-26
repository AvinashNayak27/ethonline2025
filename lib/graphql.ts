// GraphQL queries for the P2P marketplace
export const GRAPHQL_ENDPOINT = 'https://indexer.dev.hyperindex.xyz/ae5b23c/v1/graphql';

// Query to get all deposits (for buyers to see available deposits)
export const GET_DEPOSITS_QUERY = `
  query GetDeposits {
    Escrow_FundsDeposited {
      id
      depositId
      seller
      upiId
      remainingFunds
      minimumAmount
      timestamp
      transactionHash
    }
  }
`;

// Query to get buyer intents
export const GET_BUYER_INTENTS_QUERY = `
  query GetBuyerIntents {
    Escrow_BuyerIntent {
      id
      depositId
      buyer
      amount
      timestamp
      transactionHash
    }
  }
`;

// Query to get payment claims
export const GET_PAYMENT_CLAIMS_QUERY = `
  query GetPaymentClaims {
    Escrow_PaymentClaimed {
      id
      buyer
      depositId
      usdcAmount
      upiTransactionId
      timestamp
      transactionHash
    }
  }
`;

// Query to get claimed intents
export const GET_CLAIMED_INTENTS_QUERY = `
  query GetClaimedIntents {
    Escrow_ClaimedIntent {
      id
      buyer
      depositId
      amount
      timestamp
      transactionHash
    }
  }
`;

// Query to get claims for a specific deposit
export const GET_DEPOSIT_CLAIMS_QUERY = `
  query GetDepositClaims($depositId: BigInt!) {
    Escrow_PaymentClaimed(where: { depositId: $depositId }) {
      id
      buyer
      depositId
      usdcAmount
      upiTransactionId
      timestamp
      transactionHash
    }
    Escrow_ClaimedIntent(where: { depositId: $depositId }) {
      id
      buyer
      depositId
      amount
      timestamp
      transactionHash
    }
  }
`;

// Query to get funds withdrawn
export const GET_FUNDS_WITHDRAWN_QUERY = `
  query GetFundsWithdrawn {
    Escrow_FundsWithdrawn {
      id
      seller
      depositId
      amount
      timestamp
      transactionHash
    }
  }
`;

// Query to get intent cancellations
export const GET_INTENT_CANCELLATIONS_QUERY = `
  query GetIntentCancellations {
    Escrow_IntentCancelled {
      id
      buyer
      depositId
      timestamp
      transactionHash
    }
  }
`;

// Combined query to get all marketplace data
export const GET_MARKETPLACE_DATA_QUERY = `
  query GetMarketplaceData {
    Escrow_FundsDeposited {
      id
      depositId
      seller
      upiId
      remainingFunds
      minimumAmount
      timestamp
      transactionHash
    }
    Escrow_BuyerIntent {
      id
      depositId
      buyer
      amount
      timestamp
      transactionHash
    }
    Escrow_PaymentClaimed {
      id
      buyer
      depositId
      usdcAmount
      upiTransactionId
      timestamp
      transactionHash
    }
    Escrow_ClaimedIntent {
      id
      buyer
      depositId
      amount
      timestamp
      transactionHash
    }
    Escrow_FundsWithdrawn {
      id
      seller
      depositId
      amount
      timestamp
      transactionHash
    }
    Escrow_IntentCancelled {
      id
      buyer
      depositId
      timestamp
      transactionHash
    }
  }
`;

// Helper function to execute GraphQL queries
export async function executeGraphQLQuery(query: string, variables: any = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  } catch (error) {
    console.error('GraphQL query failed:', error);
    throw error;
  }
}

// Helper function to format USDC amounts (6 decimals)
export function formatUSDC(amount: string | bigint): string {
  const num = typeof amount === 'string' ? BigInt(amount) : amount;
  const usdcAmount = Number(num) / 1e6;
  return usdcAmount.toFixed(2);
}

// Helper function to format INR amounts
export function formatINR(usdcAmount: string | number): string {
  const amount = typeof usdcAmount === 'string' ? parseFloat(usdcAmount) : usdcAmount;
  const inrAmount = amount * 80; // 1 USDC = 80 INR
  return inrAmount.toFixed(2);
}

// Helper function to format timestamps
export function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Helper function to create Arbiscan transaction link
export function getArbiscanTxLink(txHash: string): string {
  return `https://arbiscan.io/tx/${txHash}`;
}

// Helper function to format relative time
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = parseInt(timestamp) * 1000;
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

// Import the hybrid functions from contract-reader
import { getMultipleDepositsRemainingFunds, type HybridDepositData } from './contract-reader';

// Hybrid function to get deposits with indexer metadata and blockchain remainingFunds
export async function getHybridDeposits(): Promise<HybridDepositData[]> {
  try {
    // First, get all deposits from the indexer (for metadata)
    const indexerData = await executeGraphQLQuery(GET_DEPOSITS_QUERY);
    const indexerDeposits = indexerData.Escrow_FundsDeposited || [];
    
    if (indexerDeposits.length === 0) {
      return [];
    }
    
    // Extract deposit IDs and get remaining funds from blockchain
    const depositIds = indexerDeposits.map((deposit: any) => deposit.depositId);
    const blockchainData = await getMultipleDepositsRemainingFunds(depositIds);
    
    // Combine indexer metadata with blockchain remainingFunds
    const hybridDeposits: HybridDepositData[] = indexerDeposits
      .map((indexerDeposit: any) => {
        const blockchainInfo = blockchainData.get(indexerDeposit.depositId);
        
        if (!blockchainInfo) {
          // If deposit doesn't exist on blockchain anymore, skip it
          return null;
        }
        
        return {
          id: indexerDeposit.id,
          depositId: indexerDeposit.depositId,
          seller: indexerDeposit.seller,
          upiId: indexerDeposit.upiId,
          remainingFunds: blockchainInfo.remainingFunds, // From blockchain
          minimumAmount: blockchainInfo.minimumAmount, // From blockchain
          timestamp: indexerDeposit.timestamp, // From indexer
          transactionHash: indexerDeposit.transactionHash, // From indexer
        };
      })
      .filter((deposit: HybridDepositData | null): deposit is HybridDepositData => deposit !== null);
    
    return hybridDeposits;
  } catch (error) {
    console.error('Error fetching hybrid deposits:', error);
    throw error;
  }
}

// Hybrid function to get marketplace data with hybrid deposits
export async function getHybridMarketplaceData() {
  try {
    // Get all marketplace data from indexer
    const indexerData = await executeGraphQLQuery(GET_MARKETPLACE_DATA_QUERY);
    
    // Get hybrid deposits (indexer metadata + blockchain remainingFunds)
    const hybridDeposits = await getHybridDeposits();
    
    return {
      ...indexerData,
      Escrow_FundsDeposited: hybridDeposits, // Replace with hybrid deposits
    };
  } catch (error) {
    console.error('Error fetching hybrid marketplace data:', error);
    throw error;
  }
}
