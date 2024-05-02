import { appendTransactionMessageInstruction, pipe } from '@solana/web3.js';
import test from 'ava';
import { getSetComputeUnitLimitInstruction } from '../src';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup';

test('it sets the compute unit limit of a transaction', async (t) => {
  // Given a payer wallet.
  const client = createDefaultSolanaClient();
  const payer = await generateKeyPairSignerWithSol(client);

  // When we create a transaction with a compute unit limit of 600,000.
  const setComputeUnit = getSetComputeUnitLimitInstruction({ units: 600_000 });
  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(setComputeUnit, tx),
    async (tx) => signAndSendTransaction(client, tx)
  );

  // Then the transaction was successful.
  t.pass();
});
