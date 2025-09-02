import {
  BaseTransactionMessage,
  getU32Decoder,
  getU64Decoder,
  Instruction,
  MicroLamports,
  ReadonlyUint8Array,
} from '@solana/kit';
import {
  COMPUTE_BUDGET_PROGRAM_ADDRESS,
  ComputeBudgetInstruction,
  identifyComputeBudgetInstruction,
  SetComputeUnitLimitInstruction,
  SetComputeUnitPriceInstruction,
} from './generated';

/**
 * Finds the index of the first `SetComputeUnitLimit` instruction in a transaction message
 * and its set limit, if any.
 */
export function getSetComputeUnitLimitInstructionIndexAndUnits(
  transactionMessage: BaseTransactionMessage
): { index: number; units: number } | null {
  const index = getSetComputeUnitLimitInstructionIndex(transactionMessage);
  if (index < 0) {
    return null;
  }

  const units = getU32Decoder().decode(
    transactionMessage.instructions[index].data as ReadonlyUint8Array,
    1
  );

  return { index, units };
}

/**
 * Finds the index of the first `SetComputeUnitLimit` instruction in a transaction message, if any.
 */
export function getSetComputeUnitLimitInstructionIndex(
  transactionMessage: BaseTransactionMessage
) {
  return transactionMessage.instructions.findIndex(
    isSetComputeUnitLimitInstruction
  );
}

/**
 * Checks if the given instruction is a `SetComputeUnitLimit` instruction.
 */
export function isSetComputeUnitLimitInstruction(
  instruction: Instruction
): instruction is SetComputeUnitLimitInstruction {
  return (
    instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS &&
    identifyComputeBudgetInstruction(instruction.data as Uint8Array) ===
      ComputeBudgetInstruction.SetComputeUnitLimit
  );
}

/**
 * Finds the index of the first `SetComputeUnitPrice` instruction in a transaction message
 * and its set micro-lamports, if any.
 */
export function getSetComputeUnitPriceInstructionIndexAndMicroLamports(
  transactionMessage: BaseTransactionMessage
): { index: number; microLamports: MicroLamports } | null {
  const index = getSetComputeUnitPriceInstructionIndex(transactionMessage);
  if (index < 0) {
    return null;
  }

  const microLamports = getU64Decoder().decode(
    transactionMessage.instructions[index].data as ReadonlyUint8Array,
    1
  ) as MicroLamports;

  return { index, microLamports };
}

/**
 * Finds the index of the first `SetComputeUnitPrice` instruction in a transaction message, if any.
 */
export function getSetComputeUnitPriceInstructionIndex(
  transactionMessage: BaseTransactionMessage
) {
  return transactionMessage.instructions.findIndex(
    isSetComputeUnitPriceInstruction
  );
}

/**
 * Checks if the given instruction is a `SetComputeUnitPrice` instruction.
 */
export function isSetComputeUnitPriceInstruction(
  instruction: Instruction
): instruction is SetComputeUnitPriceInstruction {
  return (
    instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS &&
    identifyComputeBudgetInstruction(instruction.data as Uint8Array) ===
      ComputeBudgetInstruction.SetComputeUnitPrice
  );
}
