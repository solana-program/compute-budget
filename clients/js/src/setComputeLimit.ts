import {
  appendTransactionMessageInstruction,
  BaseTransactionMessage,
} from '@solana/kit';
import { PROVISORY_COMPUTE_UNIT_LIMIT } from './constants';
import { getSetComputeUnitLimitInstruction } from './generated';
import { getSetComputeUnitLimitInstructionIndexAndUnits } from './internal';

/**
 * Appends a `SetComputeUnitLimit` instruction with a provisory
 * compute unit limit to a given transaction message
 * if and only if it does not already have one.
 */
export function fillProvisorySetComputeUnitLimitInstruction<
  TTransactionMessage extends BaseTransactionMessage,
>(transactionMessage: TTransactionMessage) {
  return updateOrAppendSetComputeUnitLimitInstruction(
    (previousUnits) =>
      previousUnits === null ? PROVISORY_COMPUTE_UNIT_LIMIT : previousUnits,
    transactionMessage
  );
}

/**
 * Updates the first `SetComputeUnitLimit` instruction in a transaction message
 * with the given units, or appends a new instruction if none exists.
 *
 * @param units - The new compute unit limit, or a function that takes the previous
 *                compute unit limit and returns the new limit.
 * @param transactionMessage - The transaction message to update.
 */
export function updateOrAppendSetComputeUnitLimitInstruction<
  TTransactionMessage extends BaseTransactionMessage,
>(
  units: number | ((previousUnits: number | null) => number),
  transactionMessage: TTransactionMessage
): TTransactionMessage {
  const getUnits = (previousUnits: number | null): number =>
    typeof units === 'function' ? units(previousUnits) : units;
  const instructionDetails =
    getSetComputeUnitLimitInstructionIndexAndUnits(transactionMessage);

  if (!instructionDetails) {
    return appendTransactionMessageInstruction(
      getSetComputeUnitLimitInstruction({ units: getUnits(null) }),
      transactionMessage
    );
  }

  const { index, units: previousUnits } = instructionDetails;
  const newUnits = getUnits(previousUnits);
  if (newUnits === previousUnits) {
    return transactionMessage;
  }

  const newInstruction = getSetComputeUnitLimitInstruction({ units: newUnits });
  const newInstructions = [...transactionMessage.instructions];
  newInstructions.splice(index, 1, newInstruction);
  return Object.freeze({
    ...transactionMessage,
    instructions: newInstructions,
  });
}
