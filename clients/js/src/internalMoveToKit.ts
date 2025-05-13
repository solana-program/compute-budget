// TODO: Add these helpers to @solana/kit in v3.

import {
  BaseTransactionMessage,
  Blockhash,
  setTransactionMessageLifetimeUsingBlockhash,
  TransactionMessageWithBlockhashLifetime,
  TransactionMessageWithDurableNonceLifetime,
} from '@solana/kit';

/**
 * An invalid blockhash lifetime constraint used as a placeholder for
 * transaction messages that are not yet ready to be compiled.
 *
 * This enables various operations on the transaction message, such as
 * simulating it or calculating its transaction size, whilst defering
 * the actual blockhash to a later stage.
 */
export const PROVISORY_BLOCKHASH_LIFETIME_CONSTRAINT: TransactionMessageWithBlockhashLifetime['lifetimeConstraint'] =
  {
    blockhash: '11111111111111111111111111111111' as Blockhash,
    lastValidBlockHeight: 0n, // This is not included in compiled transactions; it can be anything.
  };

/**
 * Sets a provisory blockhash lifetime constraint on the transaction message
 * if and only if it doesn't already have a lifetime constraint.
 */
export function fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash<
  TTransactionMessage extends BaseTransactionMessage,
>(
  transactionMessage: TTransactionMessage
): TTransactionMessage &
  (
    | TransactionMessageWithBlockhashLifetime
    | TransactionMessageWithDurableNonceLifetime
  ) {
  type ReturnType = TTransactionMessage &
    (
      | TransactionMessageWithBlockhashLifetime
      | TransactionMessageWithDurableNonceLifetime
    );

  if ('lifetimeConstraint' in transactionMessage) {
    return transactionMessage as ReturnType;
  }

  return setTransactionMessageLifetimeUsingProvisoryBlockhash(
    transactionMessage
  );
}

/**
 * Sets a provisory blockhash lifetime constraint on the transaction message.
 */
export function setTransactionMessageLifetimeUsingProvisoryBlockhash<
  TTransactionMessage extends BaseTransactionMessage,
>(
  transactionMessage: TTransactionMessage
): TTransactionMessage & TransactionMessageWithBlockhashLifetime {
  return setTransactionMessageLifetimeUsingBlockhash(
    PROVISORY_BLOCKHASH_LIFETIME_CONSTRAINT,
    transactionMessage
  );
}
