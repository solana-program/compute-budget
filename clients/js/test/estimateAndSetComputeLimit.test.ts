import {
  Address,
  BaseTransactionMessage,
  Rpc,
  SimulateTransactionApi,
  TransactionMessageWithFeePayer,
} from '@solana/kit';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  estimateAndUpdateProvisoryComputeUnitLimitFactory,
  estimateComputeUnitLimitFactory,
  getSetComputeUnitLimitInstruction,
  MAX_COMPUTE_UNIT_LIMIT,
  PROVISORY_COMPUTE_UNIT_LIMIT,
} from '../src';

const FOREVER_PROMISE = new Promise(() => {
  /* never resolve */
});

describe('estimateAndUpdateProvisoryComputeUnitLimitFactory', () => {
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

  it('appends a new SetComputeUnitLimit instruction if missing', async () => {
    expect.assertions(1);
    sendSimulateTransactionRequest.mockResolvedValue({
      value: { unitsConsumed: 42n },
    });
    const estimateAndUpdate = estimateAndUpdateProvisoryComputeUnitLimitFactory(
      estimateComputeUnitLimitFactory({ rpc })
    );

    const updatedTransactionMessage = await estimateAndUpdate(
      mockTransactionMessage
    );

    expect(updatedTransactionMessage).toEqual({
      ...mockTransactionMessage,
      instructions: [getSetComputeUnitLimitInstruction({ units: 42 })],
    });
  });

  it('updates the SetComputeUnitLimit instruction if set to PROVISORY_COMPUTE_UNIT_LIMIT', async () => {
    expect.assertions(1);
    sendSimulateTransactionRequest.mockResolvedValue({
      value: { unitsConsumed: 42n },
    });
    const estimateAndUpdate = estimateAndUpdateProvisoryComputeUnitLimitFactory(
      estimateComputeUnitLimitFactory({ rpc })
    );

    const updatedTransactionMessage = await estimateAndUpdate({
      ...mockTransactionMessage,
      instructions: [
        getSetComputeUnitLimitInstruction({
          units: PROVISORY_COMPUTE_UNIT_LIMIT,
        }),
      ],
    });

    expect(updatedTransactionMessage).toEqual({
      ...mockTransactionMessage,
      instructions: [getSetComputeUnitLimitInstruction({ units: 42 })],
    });
  });

  it('updates the SetComputeUnitLimit instruction if set to MAX_COMPUTE_UNIT_LIMIT', async () => {
    expect.assertions(1);
    sendSimulateTransactionRequest.mockResolvedValue({
      value: { unitsConsumed: 42n },
    });
    const estimateAndUpdate = estimateAndUpdateProvisoryComputeUnitLimitFactory(
      estimateComputeUnitLimitFactory({ rpc })
    );

    const updatedTransactionMessage = await estimateAndUpdate({
      ...mockTransactionMessage,
      instructions: [
        getSetComputeUnitLimitInstruction({
          units: MAX_COMPUTE_UNIT_LIMIT,
        }),
      ],
    });

    expect(updatedTransactionMessage).toEqual({
      ...mockTransactionMessage,
      instructions: [getSetComputeUnitLimitInstruction({ units: 42 })],
    });
  });

  it('does not update the SetComputeUnitLimit instruction if set to an explicit value', async () => {
    expect.assertions(1);
    sendSimulateTransactionRequest.mockResolvedValue({
      value: { unitsConsumed: 42n },
    });
    const estimateAndUpdate = estimateAndUpdateProvisoryComputeUnitLimitFactory(
      estimateComputeUnitLimitFactory({ rpc })
    );

    const updatedTransactionMessage = await estimateAndUpdate({
      ...mockTransactionMessage,
      instructions: [getSetComputeUnitLimitInstruction({ units: 123456 })],
    });

    expect(updatedTransactionMessage).toEqual({
      ...mockTransactionMessage,
      instructions: [getSetComputeUnitLimitInstruction({ units: 123456 })],
    });
  });

  it('can be aborted', () => {
    const abortController = new AbortController();
    const estimateAndUpdate = estimateAndUpdateProvisoryComputeUnitLimitFactory(
      estimateComputeUnitLimitFactory({ rpc })
    );

    estimateAndUpdate(mockTransactionMessage, {
      abortSignal: abortController.signal,
    }).catch(() => {});

    expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
      abortSignal: expect.objectContaining({ aborted: false }),
    });
    abortController.abort();
    expect(sendSimulateTransactionRequest).toHaveBeenCalledWith({
      abortSignal: expect.objectContaining({ aborted: true }),
    });
  });
});
