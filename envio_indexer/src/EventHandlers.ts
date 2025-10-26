/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  Escrow,
  Escrow_BuyerIntent,
  Escrow_FundsDeposited,
  Escrow_FundsWithdrawn,
  Escrow_IntentCancelled,
  Escrow_PaymentClaimed,
} from "generated";

Escrow.BuyerIntent.handler(async ({ event, context }) => {
  const entity: Escrow_BuyerIntent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositId: event.params.depositId,
    buyer: event.params.buyer,
    amount: event.params.amount,
    transactionHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };

  context.Escrow_BuyerIntent.set(entity);
});

Escrow.FundsDeposited.handler(async ({ event, context }) => {
  const entity: Escrow_FundsDeposited = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    depositId: event.params.depositId,
    seller: event.params.seller,
    upiId: event.params.upiId,
    remainingFunds: event.params.remainingFunds,
    minimumAmount: event.params.minimumAmount,
    transactionHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };

  context.Escrow_FundsDeposited.set(entity);
});

Escrow.FundsWithdrawn.handler(async ({ event, context }) => {
  const entity: Escrow_FundsWithdrawn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    seller: event.params.seller,
    depositId: event.params.depositId,
    amount: event.params.amount,
    transactionHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };

  context.Escrow_FundsWithdrawn.set(entity);
});

Escrow.IntentCancelled.handler(async ({ event, context }) => {
  const entity: Escrow_IntentCancelled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    buyer: event.params.buyer,
    depositId: event.params.depositId,
    transactionHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };

  context.Escrow_IntentCancelled.set(entity);
});

Escrow.PaymentClaimed.handler(async ({ event, context }) => {
  const entity: Escrow_PaymentClaimed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    buyer: event.params.buyer,
    usdcAmount: event.params.usdcAmount,
    upiTransactionId: event.params.upiTransactionId,
    transactionHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };

  context.Escrow_PaymentClaimed.set(entity);
});
