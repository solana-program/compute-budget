import {
  appendTransactionMessageInstruction,
  BaseTransactionMessage,
  MicroLamports,
} from '@solana/kit';
import { getSetComputeUnitPriceInstruction } from './generated';
import { getSetComputeUnitPriceInstructionIndexAndMicroLamports } from './internal';

export function setTransactionMessageComputeUnitPrice<
  TTransactionMessage extends BaseTransactionMessage,
>(microLamports: number | bigint, transactionMessage: TTransactionMessage) {
  return appendTransactionMessageInstruction(
    getSetComputeUnitPriceInstruction({ microLamports }),
    transactionMessage
  );
}

/**
 * Updates the first `SetComputeUnitPrice` instruction in a transaction message
 * with the given units, or appends a new instruction if none exists.
 *
 * @param microLamports - The new compute unit price, or a function that
 *                        takes the previous price and returns the new one.
 * @param transactionMessage - The transaction message to update.
 */
export function updateOrAppendSetComputeUnitPriceInstruction<
  TTransactionMessage extends BaseTransactionMessage,
>(
  microLamports:
    | MicroLamports
    | ((previousMicroLamports: MicroLamports | null) => MicroLamports),
  transactionMessage: TTransactionMessage
): TTransactionMessage {
  const getMicroLamports = (
    previousMicroLamports: MicroLamports | null
  ): MicroLamports =>
    typeof microLamports === 'function'
      ? microLamports(previousMicroLamports)
      : microLamports;
  const instructionDetails =
    getSetComputeUnitPriceInstructionIndexAndMicroLamports(transactionMessage);

  if (!instructionDetails) {
    return appendTransactionMessageInstruction(
      getSetComputeUnitPriceInstruction({
        microLamports: getMicroLamports(null),
      }),
      transactionMessage
    );
  }

  const { index, microLamports: previousMicroLamports } = instructionDetails;
  const newMicroLamports = getMicroLamports(previousMicroLamports);
  if (newMicroLamports === previousMicroLamports) {
    return transactionMessage;
  }

  const newInstruction = getSetComputeUnitPriceInstruction({
    microLamports: newMicroLamports,
  });
  const newInstructions = [...transactionMessage.instructions];
  newInstructions.splice(index, 1, newInstruction);
  return Object.freeze({
    ...transactionMessage,
    instructions: newInstructions,
  });
}
