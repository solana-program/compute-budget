/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Address,
  Codec,
  Decoder,
  Encoder,
  IAccountMeta,
  IInstruction,
  IInstructionWithAccounts,
  IInstructionWithData,
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
} from '@solana/web3.js';
import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '../programs';

export type SetComputeUnitLimitInstruction<
  TProgram extends string = typeof COMPUTE_BUDGET_PROGRAM_ADDRESS,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<TRemainingAccounts>;

export type SetComputeUnitLimitInstructionData = {
  discriminator: number;
  /** Transaction-wide compute unit limit. */
  units: number;
};

export type SetComputeUnitLimitInstructionDataArgs = {
  /** Transaction-wide compute unit limit. */
  units: number;
};

export function getSetComputeUnitLimitInstructionDataEncoder(): Encoder<SetComputeUnitLimitInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['units', getU32Encoder()],
    ]),
    (value) => ({ ...value, discriminator: 2 })
  );
}

export function getSetComputeUnitLimitInstructionDataDecoder(): Decoder<SetComputeUnitLimitInstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['units', getU32Decoder()],
  ]);
}

export function getSetComputeUnitLimitInstructionDataCodec(): Codec<
  SetComputeUnitLimitInstructionDataArgs,
  SetComputeUnitLimitInstructionData
> {
  return combineCodec(
    getSetComputeUnitLimitInstructionDataEncoder(),
    getSetComputeUnitLimitInstructionDataDecoder()
  );
}

export type SetComputeUnitLimitInput = {
  units: SetComputeUnitLimitInstructionDataArgs['units'];
};

export function getSetComputeUnitLimitInstruction(
  input: SetComputeUnitLimitInput
): SetComputeUnitLimitInstruction<typeof COMPUTE_BUDGET_PROGRAM_ADDRESS> {
  // Program address.
  const programAddress = COMPUTE_BUDGET_PROGRAM_ADDRESS;

  // Original args.
  const args = { ...input };

  const instruction = {
    programAddress,
    data: getSetComputeUnitLimitInstructionDataEncoder().encode(
      args as SetComputeUnitLimitInstructionDataArgs
    ),
  } as SetComputeUnitLimitInstruction<typeof COMPUTE_BUDGET_PROGRAM_ADDRESS>;

  return instruction;
}

export type ParsedSetComputeUnitLimitInstruction<
  TProgram extends string = typeof COMPUTE_BUDGET_PROGRAM_ADDRESS,
> = {
  programAddress: Address<TProgram>;
  data: SetComputeUnitLimitInstructionData;
};

export function parseSetComputeUnitLimitInstruction<TProgram extends string>(
  instruction: IInstruction<TProgram> & IInstructionWithData<Uint8Array>
): ParsedSetComputeUnitLimitInstruction<TProgram> {
  return {
    programAddress: instruction.programAddress,
    data: getSetComputeUnitLimitInstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
