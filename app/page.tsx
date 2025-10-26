'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import ConnectWalletButton from '@/components/connect-button';
import InitButton from '@/components/init-button';
import DeinitButton from '@/components/de-init-button';
import BridgeAndExecuteButtonComponent from '@/components/bridge-and-execute-button';
import VerifyOffchainPaymentButton from '@/components/verify-offchain-payment-button';
import SignalIntentButton from '@/components/signal-intent-button';
import CancelIntentButton from '@/components/cancel-intent-button';
import WithdrawFundsButton from '@/components/withdraw-funds-button';
import DepositDetailCard from '@/components/deposit-detail-card';
import { CardSkeleton } from '@/components/loading-skeleton';
import { isInitialized } from '@/lib/nexus';
import { executeGraphQLQuery, GET_MARKETPLACE_DATA_QUERY, getHybridMarketplaceData, formatUSDC, formatINR, formatTimestamp, formatRelativeTime, getArbiscanTxLink } from '@/lib/graphql';
import { readAllDeposits, readActiveIntent, readDeposit, formatUSDCFromContract, checkActiveIntent, type DepositData, type IntentData, type HybridDepositData } from '@/lib/contract-reader';

interface Deposit {
  id: string;
  depositId: string;
  seller: string;
  upiId: string;
  remainingFunds: string;
  minimumAmount: string;
  timestamp: string;
  transactionHash: string;
}

interface BuyerIntent {
  id: string;
  depositId: string;
  buyer: string;
  amount: string;
  timestamp: string;
  transactionHash: string;
}

interface PaymentClaimed {
  id: string;
  buyer: string;
  depositId: string;
  usdcAmount: string;
  upiTransactionId: string;
  timestamp: string;
  transactionHash: string;
}

interface ClaimedIntent {
  id: string;
  buyer: string;
  depositId: string;
  amount: string;
  timestamp: string;
  transactionHash: string;
}

interface MarketplaceData {
  Escrow_FundsDeposited: HybridDepositData[];
  Escrow_BuyerIntent: BuyerIntent[];
  Escrow_PaymentClaimed: PaymentClaimed[];
  Escrow_ClaimedIntent: ClaimedIntent[];
  Escrow_FundsWithdrawn: any[];
  Escrow_IntentCancelled: any[];
}

export default function MarketplacePage() {
  const { isConnected, address } = useAccount();
  const [initialized, setInitialized] = useState(isInitialized());
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceData | null>(null);
  const [hybridDeposits, setHybridDeposits] = useState<HybridDepositData[]>([]);
  const [userActiveIntent, setUserActiveIntent] = useState<IntentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<string | null>(null);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch hybrid marketplace data (indexer + blockchain) and active intent
      const [hybridData, activeIntent] = await Promise.all([
        getHybridMarketplaceData(),
        address ? readActiveIntent(address) : Promise.resolve(null)
      ]);
      
      setMarketplaceData(hybridData);
      setHybridDeposits(hybridData.Escrow_FundsDeposited);
      setUserActiveIntent(activeIntent);
    } catch (err) {
      setError('Failed to fetch marketplace data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && initialized) {
      fetchMarketplaceData();
    }
  }, [isConnected, initialized]);

  const getMyDeposits = () => {
    if (!address) return [];
    return hybridDeposits.filter(
      deposit => deposit.seller.toLowerCase() === address.toLowerCase()
    );
  };

  const getAvailableDeposits = () => {
    // Filter out deposits with zero remaining funds for buyers
    return hybridDeposits.filter(deposit => parseFloat(deposit.remainingFunds) > 0);
  };


  const getMyClaims = () => {
    if (!marketplaceData || !address) return [];
    
    // Get only payment claims for the current user (no intent claims)
    const paymentClaims = marketplaceData.Escrow_PaymentClaimed.filter(
      claim => claim.buyer.toLowerCase() === address.toLowerCase()
    );
    
    // Format payment claims
    const allClaims = paymentClaims.map(claim => ({
      id: claim.id,
      buyer: claim.buyer,
      depositId: claim.depositId,
      usdcAmount: claim.usdcAmount,
      upiTransactionId: claim.upiTransactionId,
      timestamp: claim.timestamp,
      transactionHash: claim.transactionHash,
      type: 'payment' as const
    }));
    
    // Sort by timestamp (newest first)
    return allClaims.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
  };

  const hasActiveIntent = (depositId: string) => {
    if (!userActiveIntent) return false;
    return userActiveIntent.depositId === depositId;
  };

  const getActiveIntent = (depositId: string) => {
    if (!userActiveIntent || userActiveIntent.depositId !== depositId) return null;
    return userActiveIntent;
  };

  // Check if user has any active intent (regardless of deposit)
  const hasAnyActiveIntent = () => {
    return !!userActiveIntent;
  };

  const getClaimsForDeposit = (depositId: string) => {
    if (!marketplaceData) return [];
    
    // Get only payment claims for this deposit (no intent claims)
    const paymentClaims = marketplaceData.Escrow_PaymentClaimed.filter(claim => 
      claim.depositId === depositId
    );
    
    // Format payment claims
    const allClaims = paymentClaims.map(claim => ({
      id: claim.id,
      buyer: claim.buyer,
      depositId: claim.depositId,
      usdcAmount: claim.usdcAmount,
      upiTransactionId: claim.upiTransactionId,
      timestamp: claim.timestamp,
      transactionHash: claim.transactionHash,
      type: 'payment' as const
    }));
    
    // Sort by timestamp (newest first)
    return allClaims.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
  };

  const getDepositWithDetails = (depositId: string) => {
    const deposit = hybridDeposits.find(d => d.depositId === depositId);
    if (!deposit) return null;
    
    const activeIntent = getActiveIntent(depositId);
    const claims = getClaimsForDeposit(depositId);
    
    // Convert hybrid data to match the expected interface
    const depositWithDetails = {
      id: deposit.id,
      depositId: deposit.depositId,
      seller: deposit.seller,
      upiId: deposit.upiId,
      remainingFunds: deposit.remainingFunds, // From blockchain
      minimumAmount: deposit.minimumAmount, // From blockchain
      timestamp: deposit.timestamp, // From indexer
      transactionHash: deposit.transactionHash, // From indexer
      activeIntent,
      claims,
      hasActiveIntent: !!activeIntent,
      totalClaimed: claims.reduce((sum, claim) => sum + parseFloat(formatUSDC(claim.usdcAmount)), 0)
    };
    
    return depositWithDetails;
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md card-coffee p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--coffee-espresso)' }}>
              P2P USDC Marketplace
            </h1>
            <p className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
              Trade USDC for INR with other users
            </p>
          </div>
          <ConnectWalletButton className="btn-coffee w-full" />
        </div>
      </main>
    );
  }

  if (!initialized) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md card-coffee p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--coffee-espresso)' }}>
              Initialize Nexus
            </h1>
            <p className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
              Initialize Nexus to enable cross-chain USDC bridging
            </p>
          </div>
          <InitButton className="btn-coffee w-full" onReady={() => setInitialized(true)} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--coffee-espresso)' }}>
                P2P USDC Marketplace
              </h1>
              <p className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                Trade USDC for INR with other users
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectWalletButton className="btn-coffee" />
              <DeinitButton className="btn-outline-coffee" onDone={() => setInitialized(false)} />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-container">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`tab-button ${activeTab === 'buyer' ? 'active' : 'inactive'}`}
            >
              Buy USDC
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`tab-button ${activeTab === 'seller' ? 'active' : 'inactive'}`}
            >
              Sell USDC
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Buyer Tab */}
        {activeTab === 'buyer' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--coffee-espresso)' }}>
                Available USDC Deposits
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--coffee-muted)' }}>
                  (Live from blockchain)
                </span>
              </h2>
              <button
                onClick={fetchMarketplaceData}
                disabled={loading}
                className="btn-outline-coffee"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="marketplace-grid">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : getAvailableDeposits().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                  No deposits available
                </div>
              </div>
            ) : (
              <div className="marketplace-grid">
                {getAvailableDeposits().map((deposit) => (
                  <div
                    key={deposit.id}
                    className="marketplace-card p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--coffee-espresso)' }}>
                          Deposit #{deposit.depositId}
                        </span>
                        <span className="status-badge status-active">
                          {formatUSDCFromContract(deposit.remainingFunds)} USDC
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--coffee-muted)' }}>UPI ID:</span>
                          <span className="font-medium">{deposit.upiId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--coffee-muted)' }}>Min Amount:</span>
                          <span className="font-medium">{formatUSDCFromContract(deposit.minimumAmount)} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--coffee-muted)' }}>Value (INR):</span>
                          <span className="font-medium">₹{formatINR(formatUSDCFromContract(deposit.remainingFunds))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--coffee-muted)' }}>Created:</span>
                          <span className="font-medium">
                            {deposit.timestamp === "0" ? "Unknown" : formatRelativeTime(deposit.timestamp)}
                          </span>
                        </div>
                        {deposit.transactionHash && (
                          <div className="flex justify-between items-center">
                            <span style={{ color: 'var(--coffee-muted)' }}>Transaction:</span>
                            <a
                              href={getArbiscanTxLink(deposit.transactionHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            >
                              View on Arbiscan
                            </a>
                          </div>
                        )}
                      </div>

                      {hasActiveIntent(deposit.depositId) ? (
                        <div className="space-y-2">
                          <div className="text-center py-2">
                            <span className="status-badge status-pending">
                              Intent Active
                            </span>
                          </div>
                          <div className="space-y-2">
                            <VerifyOffchainPaymentButton 
                              className="btn-coffee w-full" 
                              onSuccess={fetchMarketplaceData}
                              onBridge={() => {
                                // Bridge action handled by the modal
                                console.log('User chose to bridge USDC');
                              }}
                            />
                            <CancelIntentButton 
                              className="btn-outline-coffee w-full" 
                              onSuccess={fetchMarketplaceData}
                            />
                          </div>
                        </div>
                      ) : hasAnyActiveIntent() ? (
                        <div className="text-center py-2">
                          <span className="status-badge status-pending text-xs">
                            Intent Active on Another Deposit
                          </span>
                        </div>
                      ) : (
                        <SignalIntentButton
                          depositId={deposit.depositId}
                          minimumAmount={deposit.minimumAmount}
                          remainingFunds={deposit.remainingFunds}
                          onSuccess={fetchMarketplaceData}
                          disabled={hasAnyActiveIntent()}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Current Active Intent */}
            {userActiveIntent && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--coffee-espresso)' }}>
                  Your Active Intent
                </h3>
                <div className="p-4 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Deposit #{userActiveIntent.depositId}</div>
                        <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                          Amount: {formatUSDCFromContract(userActiveIntent.amount)} USDC
                        </div>
                        <div className="text-xs" style={{ color: 'var(--coffee-muted)' }}>
                          Created: {userActiveIntent.timestamp === "0" ? "Unknown" : formatRelativeTime(userActiveIntent.timestamp)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="status-badge status-pending">
                          Active Intent
                        </span>
                        <div className="flex gap-2">
                          <VerifyOffchainPaymentButton 
                            className="btn-coffee" 
                            onSuccess={fetchMarketplaceData}
                            onBridge={() => {
                              // Bridge action handled by the modal
                              console.log('User chose to bridge USDC');
                            }}
                          />
                          <CancelIntentButton 
                            className="btn-outline-coffee" 
                            onSuccess={fetchMarketplaceData}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* My Claims */}
            {getMyClaims().length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--coffee-espresso)' }}>
                  My Claims
                </h3>
                <div className="space-y-3">
                  {getMyClaims().map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 rounded-lg"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              Claimed: {formatUSDC(claim.usdcAmount)} USDC
                            </div>
                            <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                              Deposit #{claim.depositId}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                              UPI Txn: {claim.upiTransactionId}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--coffee-muted)' }}>
                              Claimed: {formatRelativeTime(claim.timestamp)}
                            </div>
                          </div>
                          <span className="status-badge status-completed">
                            Completed
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Transaction:</span>
                          <a
                            href={getArbiscanTxLink(claim.transactionHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            View on Arbiscan
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seller Tab */}
        {activeTab === 'seller' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--coffee-espresso)' }}>
                My USDC Deposits
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--coffee-muted)' }}>
                  (Live from blockchain)
                </span>
              </h2>
              <div className="flex gap-2">
                <BridgeAndExecuteButtonComponent className="btn-coffee" />
                <button
                  onClick={fetchMarketplaceData}
                  disabled={loading}
                  className="btn-outline-coffee"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="marketplace-grid">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : getMyDeposits().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                  No deposits yet. Create your first deposit to start selling USDC.
                </div>
              </div>
            ) : (
              <div className="marketplace-grid">
                {getMyDeposits().map((deposit) => {
                  const depositDetails = getDepositWithDetails(deposit.depositId);
                  const hasActiveIntent = depositDetails?.hasActiveIntent || false;
                  const activeIntent = depositDetails?.activeIntent;
                  const hasRemainingFunds = parseFloat(deposit.remainingFunds) > 0;
                  
                  return (
                    <div
                      key={deposit.id}
                      className="marketplace-card p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                      style={{
                        backgroundColor: !hasRemainingFunds ? '#fef2f2' : '#ffffff',
                        borderColor: !hasRemainingFunds ? '#fecaca' : 'var(--color-border)'
                      }}
                      onClick={() => setSelectedDeposit(deposit.depositId)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: 'var(--coffee-espresso)' }}>
                            Deposit #{deposit.depositId}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            {hasRemainingFunds ? (
                              <span className="status-badge status-active">
                                {formatUSDCFromContract(deposit.remainingFunds)} USDC
                              </span>
                            ) : (
                              <span className="status-badge status-completed">
                                Fully Claimed
                              </span>
                            )}
                            {hasActiveIntent && hasRemainingFunds && (
                              <span className="status-badge status-pending text-xs">
                                Active Intent
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--coffee-muted)' }}>UPI ID:</span>
                            <span className="font-medium">{deposit.upiId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--coffee-muted)' }}>Min Amount:</span>
                            <span className="font-medium">{formatUSDCFromContract(deposit.minimumAmount)} USDC</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--coffee-muted)' }}>Value (INR):</span>
                            <span className="font-medium">₹{formatINR(formatUSDCFromContract(deposit.remainingFunds))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--coffee-muted)' }}>Created:</span>
                            <span className="font-medium">
                              {deposit.timestamp === "0" ? "Unknown" : formatRelativeTime(deposit.timestamp)}
                            </span>
                          </div>
                          {activeIntent && (
                            <div className="flex justify-between">
                              <span style={{ color: 'var(--coffee-muted)' }}>Intent Amount:</span>
                              <span className="font-medium text-orange-600">{formatUSDCFromContract(activeIntent.amount)} USDC</span>
                            </div>
                          )}
                          {deposit.transactionHash && (
                            <div className="flex justify-between items-center">
                              <span style={{ color: 'var(--coffee-muted)' }}>Transaction:</span>
                              <a
                                href={getArbiscanTxLink(deposit.transactionHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View on Arbiscan
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {hasRemainingFunds ? (
                            <div className="text-center py-2">
                              <span className="text-xs" style={{ color: 'var(--coffee-muted)' }}>
                                Click to view details and withdraw funds
                              </span>
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              <span className="text-xs text-red-700 font-medium">
                                Deposit fully claimed
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Detailed Deposit Card */}
        {selectedDeposit && (
          <DepositDetailCard
            deposit={getDepositWithDetails(selectedDeposit)!}
            onClose={() => setSelectedDeposit(null)}
            onRefresh={fetchMarketplaceData}
          />
        )}
      </div>
    </main>
  );
}