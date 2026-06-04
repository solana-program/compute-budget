import { expect, test } from 'vitest';

import { createTestClient } from './_setup';

test('it sets the compute unit limit of a transaction', async () => {
    // Given a test client with a funded payer.
    const client = await createTestClient();

    // When we send a transaction that sets a compute unit limit of 600,000.
    const promise = client.computeBudget.instructions.setComputeUnitLimit({ units: 600_000 }).sendTransaction();

    // Then the transaction was successful.
    await expect(promise).resolves.toBeTruthy();
});
