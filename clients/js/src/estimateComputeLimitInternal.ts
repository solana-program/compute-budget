import {
  Commitment,
  CompilableTransactionMessage,
  compileTransaction,
  getBase64EncodedWireTransaction,
  isDurableNonceTransaction,
  isSolanaError,
  ITransactionMessageWithFeePayer,
  pipe,
  Rpc,
  SimulateTransactionApi,
  Slot,
  SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
  SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
  SolanaError,
  Transaction,
  TransactionMessage,
} from '@solana/kit';
import { updateOrAppendSetComputeUnitLimitInstruction } from './setComputeLimit';
import { MAX_COMPUTE_UNIT_LIMIT } from './constants';
import { fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash } from './internalMoveToKit';

export type EstimateComputeUnitLimitFactoryConfig = Readonly<{
  /** An object that supports the {@link SimulateTransactionApi} of the Solana RPC API */
  rpc: Rpc<SimulateTransactionApi>;
}>;

export type EstimateComputeUnitLimitFactoryFunction = (
  transactionMessage:
    | CompilableTransactionMessage
    | (TransactionMessage & ITransactionMessageWithFeePayer),
  config?: EstimateComputeUnitLimitFactoryFunctionConfig
) => Promise<number>;

export type EstimateComputeUnitLimitFactoryFunctionConfig = {
  abortSignal?: AbortSignal;
  /**
   * Compute the estimate as of the highest slot that has reached this level of commitment.
   *
   * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
   * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
   * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
   * default commitment applied by the server is `"finalized"`.
   */
  commitment?: Commitment;
  /**
   * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
   * this slot
   */
  minContextSlot?: Slot;
};

type EstimateComputeUnitLimitConfig =
  EstimateComputeUnitLimitFactoryFunctionConfig &
    Readonly<{
      rpc: Rpc<SimulateTransactionApi>;
      transactionMessage:
        | CompilableTransactionMessage
        | (TransactionMessage & ITransactionMessageWithFeePayer);
    }>;

/**
 * Simulates a transaction message on the network and returns the number of compute units it
 * consumed during simulation.
 *
 * The estimate this function returns can be used to set a compute unit limit on the transaction.
 * Correctly budgeting a compute unit limit for your transaction message can increase the probability
 * that your transaction will be accepted for processing.
 *
 * If you don't declare a compute unit limit on your transaction, validators will assume an upper
 * limit of 200K compute units (CU) per instruction. Since validators have an incentive to pack as
 * many transactions into each block as possible, they may choose to include transactions that they
 * know will fit into the remaining compute budget for the current block over transactions that
 * might not. For this reason, you should set a compute unit limit on each of your transaction
 * messages, whenever possible.
 *
 * ## Example
 *
 * ```ts
 * import { getSetComputeLimitInstruction } from '@solana-program/compute-budget';
 * import { createSolanaRpc, getComputeUnitEstimateForTransactionMessageFactory, pipe } from '@solana/kit';
 *
 * // Create an estimator function.
 * const rpc = createSolanaRpc('http://127.0.0.1:8899');
 * const getComputeUnitEstimateForTransactionMessage =
 *     getComputeUnitEstimateForTransactionMessageFactory({ rpc });
 *
 * // Create your transaction message.
 * const transactionMessage = pipe(
 *     createTransactionMessage({ version: 'legacy' }),
 *     /* ... *\/
 * );
 *
 * // Request an estimate of the actual compute units this message will consume.
 * const computeUnitsEstimate =
 *     await getComputeUnitEstimateForTransactionMessage(transactionMessage);
 *
 * // Set the transaction message's compute unit budget.
 * const transactionMessageWithComputeUnitLimit = prependTransactionMessageInstruction(
 *     getSetComputeLimitInstruction({ units: computeUnitsEstimate }),
 *     transactionMessage,
 * );
 * ```
 *
 * > [!WARNING]
 * > The compute unit estimate is just that &ndash; an estimate. The compute unit consumption of the
 * > actual transaction might be higher or lower than what was observed in simulation. Unless you
 * > are confident that your particular transaction message will consume the same or fewer compute
 * > units as was estimated, you might like to augment the estimate by either a fixed number of CUs
 * > or a multiplier.
 *
 * > [!NOTE]
 * > If you are preparing an _unsigned_ transaction, destined to be signed and submitted to the
 * > network by a wallet, you might like to leave it up to the wallet to determine the compute unit
 * > limit. Consider that the wallet might have a more global view of how many compute units certain
 * > types of transactions consume, and might be able to make better estimates of an appropriate
 * > compute unit budget.
 */
export async function estimateComputeUnitLimit({
  transactionMessage,
  ...configs
}: EstimateComputeUnitLimitConfig): Promise<number> {
  const replaceRecentBlockhash = !isDurableNonceTransaction(transactionMessage);
  const transaction = pipe(
    transactionMessage,
    fillMissingTransactionMessageLifetimeUsingProvisoryBlockhash,
    (m) =>
      updateOrAppendSetComputeUnitLimitInstruction(MAX_COMPUTE_UNIT_LIMIT, m),
    compileTransaction
  );

  return await simulateTransactionAndGetConsumedUnits({
    transaction,
    replaceRecentBlockhash,
    ...configs,
  });
}

type SimulateTransactionAndGetConsumedUnitsConfig = Omit<
  EstimateComputeUnitLimitConfig,
  'transactionMessage'
> &
  Readonly<{ replaceRecentBlockhash?: boolean; transaction: Transaction }>;

async function simulateTransactionAndGetConsumedUnits({
  abortSignal,
  rpc,
  transaction,
  ...simulateConfig
}: SimulateTransactionAndGetConsumedUnitsConfig): Promise<number> {
  const wireTransactionBytes = getBase64EncodedWireTransaction(transaction);

  try {
    const {
      value: { err: transactionError, unitsConsumed },
    } = await rpc
      .simulateTransaction(wireTransactionBytes, {
        ...simulateConfig,
        encoding: 'base64',
        sigVerify: false,
      })
      .send({ abortSignal });
    if (unitsConsumed == null) {
      // This should never be hit, because all RPCs should support `unitsConsumed` by now.
      throw new SolanaError(
        SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT
      );
    }
    // FIXME(https://github.com/anza-xyz/agave/issues/1295): The simulation response returns
    // compute units as a u64, but the `SetComputeLimit` instruction only accepts a u32. Until
    // this changes, downcast it.
    const downcastUnitsConsumed =
      unitsConsumed > 4_294_967_295n ? 4_294_967_295 : Number(unitsConsumed);
    if (transactionError) {
      throw new SolanaError(
        SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT,
        {
          cause: transactionError,
          unitsConsumed: downcastUnitsConsumed,
        }
      );
    }
    return downcastUnitsConsumed;
  } catch (e) {
    if (
      isSolanaError(
        e,
        SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT
      )
    )
      throw e;
    throw new SolanaError(
      SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_COMPUTE_LIMIT,
      { cause: e }
    );
  }
}
