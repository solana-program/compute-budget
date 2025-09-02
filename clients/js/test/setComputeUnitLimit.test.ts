import { appendTransactionMessageInstruction, pipe } from '@solana/kit';
import { expect, test } from 'vitest';
import { getSetComputeUnitLimitInstruction } from '../src';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup';

test('it sets the compute unit limit of a transaction', async () => {
  // Given a payer wallet.
  const client = createDefaultSolanaClient();
  const payer = await generateKeyPairSignerWithSol(client);

  // When we create a transaction with a compute unit limit of 600,000.
  const setComputeUnit = getSetComputeUnitLimitInstruction({
    units: 600_000,
  });
  const promise = pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(setComputeUnit, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then the transaction was successful.
  await expect(promise).resolves.toBeTruthy();
});
