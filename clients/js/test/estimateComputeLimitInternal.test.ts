import {
  AccountRole,
  Address,
  BaseTransactionMessage,
  Blockhash,
  compileTransaction,
  Nonce,
  Rpc,
  SimulateTransactionApi,
  SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS,
  SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
  SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
  SolanaError,
  TransactionError,
  TransactionMessageWithFeePayer,
} from '@solana/kit';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  getSetComputeUnitLimitInstruction,
  MAX_COMPUTE_UNIT_LIMIT,
} from '../src';
import { estimateComputeUnitLimit } from '../src/estimateComputeLimitInternal';

// Spy on the `compileTransaction` function.
vi.mock('@solana/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/kit')>();
  return {
    ...actual,
    compileTransaction: vi.fn(actual.compileTransaction),
  };
});

const FOREVER_PROMISE = new Promise(() => {
  /* never resolve */
});

const MOCK_BLOCKHASH_LIFETIME_CONSTRAINT = {
  blockhash: 'GNtuHnNyW68wviopST3ki37Afv7LPphxfSwiHAkX5Q9H' as Blockhash,
  lastValidBlockHeight: 0n,
} as const;

describe('estimateComputeUnitLimit', () => {
  let sendSimulateTransactionRequest: Mock;
  let mockTransactionMessage: BaseTransactionMessage &
    TransactionMessageWithFeePayer;
  let rpc: Rpc<SimulateTransactionApi>;
  let simulateTransaction: Mock;

  beforeEach(() => {
    mockTransactionMessage = {
      feePayer: {
        address: '7U8VWgTUucttJPt5Bbkt48WknWqRGBfstBt8qqLHnfPT' as Address,
      },
      instructions: [],
      version: 0,
    };
    sendSimulateTransactionRequest = vi.fn().mockReturnValue(FOREVER_PROMISE);
    simulateTransaction = vi.fn().mockReturnValue({
      send: sendSimulateTransactionRequest,
    });
    rpc = { simulateTransaction };
  });

  it('aborts the `simulateTransaction` request when aborted', () => {
    const abortController = new AbortController();
    const transactionMessage = {
      ...mockTransactionMessage,
      lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT,
    };
    estimateComputeUnitLimit({
      abortSignal: abortController.signal,
      rpc,
      transactionMessage,
    }).catch(() => {});

    expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
      abortSignal: expect.objectContaining({ aborted: false }),
    });
    abortController.abort();
    expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
      abortSignal: expect.objectContaining({ aborted: true }),
    });
  });

  it('passes the expected basic input to the simulation request', () => {
    const transactionMessage = {
      ...mockTransactionMessage,
      lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT,
    };
    estimateComputeUnitLimit({
      commitment: 'finalized',
      minContextSlot: 42n,
      rpc,
      transactionMessage,
    }).catch(() => {});

    expect(simulateTransaction).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        commitment: 'finalized',
        encoding: 'base64',
        minContextSlot: 42n,
        sigVerify: false,
      })
    );
  });

  it('appends a set compute unit limit instruction when one does not exist', () => {
    const transactionMessage = {
      ...mockTransactionMessage, // No `SetComputeUnitLimit` instruction
      lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT,
    };

    estimateComputeUnitLimit({
      rpc,
      transactionMessage,
    }).catch(() => {});

    expect(compileTransaction).toHaveBeenCalledWith({
      ...transactionMessage,
      instructions: [
        ...transactionMessage.instructions,
        getSetComputeUnitLimitInstruction({ units: MAX_COMPUTE_UNIT_LIMIT }),
      ],
    });
  });

  it('replaces the existing set compute unit limit instruction when one exists', () => {
    const mockInstruction = {
      programAddress: '4Kk4nA3F2nWHCcuyT8nR6oF7HQUQHmmzAVD5k8FQPKB2' as Address,
    };
    const transactionMessage = {
      ...mockTransactionMessage,
      instructions: [
        mockInstruction,
        getSetComputeUnitLimitInstruction({ units: 1234 }),
        mockInstruction,
      ],
      lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT,
    };

    estimateComputeUnitLimit({
      rpc,
      transactionMessage,
    }).catch(() => {});

    expect(compileTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: [
          mockInstruction,
          getSetComputeUnitLimitInstruction({ units: MAX_COMPUTE_UNIT_LIMIT }),
          mockInstruction,
        ],
      })
    );
  });

  it('does not ask for a replacement blockhash when the transaction message is a durable nonce transaction', () => {
    const transactionMessage = {
      ...mockTransactionMessage,
      instructions: [
        {
          accounts: [
            {
              address:
                '7wJFRFuAE9x5Ptnz2VoBWsfecTCfuuM2sQCpECGypnTU' as Address,
              role: AccountRole.WRITABLE,
            },
            {
              address: 'SysvarRecentB1ockHashes11111111111111111111' as Address,
              role: AccountRole.READONLY,
            },
            {
              address:
                'HzMoc78z1VNNf9nwD4Czt6CDYEb9LVD8KsVGP46FEmyJ' as Address,
              role: AccountRole.READONLY_SIGNER,
            },
          ],
          data: new Uint8Array([4, 0, 0, 0]),
          programAddress: '11111111111111111111111111111111' as Address,
        },
      ],
      lifetimeConstraint: {
        nonce: 'BzAqD6382v5r1pcELoi8HWrBDV4dSL9NGemMn2JYAhxc' as Nonce,
      },
    };
    estimateComputeUnitLimit({ rpc, transactionMessage }).catch(() => {});

    expect(simulateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ replaceRecentBlockhash: false })
    );
  });

  it('asks for a replacement blockhash even when the transaction message has a blockhash lifetime', () => {
    const transactionMessage = {
      ...mockTransactionMessage,
      lifetimeConstraint: MOCK_BLOCKHASH_LIFETIME_CONSTRAINT,
    };
    estimateComputeUnitLimit({ rpc, transactionMessage }).catch(() => {});

    expect(simulateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ replaceRecentBlockhash: true })
    );
  });

  it('asks for a replacement blockhash when the transaction message has no lifetime', () => {
    estimateComputeUnitLimit({
      rpc,
      transactionMessage: mockTransactionMessage,
    }).catch(() => {});

    expect(simulateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ replaceRecentBlockhash: true })
    );
  });

  it('returns the estimated compute units on success', async () => {
    expect.assertions(1);
    sendSimulateTransactionRequest.mockResolvedValue({
      value: { unitsConsumed: 42n },
    });

    const estimatePromise = estimateComputeUnitLimit({
      rpc,
      transactionMessage: mockTransactionMessage,
    });

    await expect(estimatePromise).resolves.toBe(42);
  });

  it('caps the estimated compute units to MAX_COMPUTE_UNITS of 1.4M', async () => {
    expect.assertions(1);
    sendSimulateTransactionRequest.mockResolvedValue({
      value: { unitsConsumed: 1400000n /* MAX_COMPUTE_UNITS */ },
    });

    const estimatePromise = estimateComputeUnitLimit({
      rpc,
      transactionMessage: mockTransactionMessage,
    });

    await expect(estimatePromise).resolves.toBe(1400000);
  });

  it('throws with the transaction error as cause when the transaction fails in simulation', async () => {
    expect.assertions(1);
    const transactionError: TransactionError = 'AccountNotFound';
    sendSimulateTransactionRequest.mockResolvedValue({
      value: { err: transactionError, unitsConsumed: 42n },
    });

    const estimatePromise = estimateComputeUnitLimit({
      rpc,
      transactionMessage: mockTransactionMessage,
    });

    await expect(estimatePromise).rejects.toThrow(
      new SolanaError(
        SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
        {
          cause: transactionError,
          unitsConsumed: 42,
        }
      )
    );
  });

  it('throws with the cause when simulation fails', async () => {
    expect.assertions(1);
    const simulationError = new SolanaError(
      SOLANA_ERROR__INSTRUCTION_ERROR__INSUFFICIENT_FUNDS,
      { index: 42 }
    );
    sendSimulateTransactionRequest.mockRejectedValue(simulationError);

    const estimatePromise = estimateComputeUnitLimit({
      rpc,
      transactionMessage: mockTransactionMessage,
    });

    await expect(estimatePromise).rejects.toThrow(
      new SolanaError(
        SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
        { cause: simulationError }
      )
    );
  });
});
