/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type IAccountMeta,
  type IInstruction,
  type IInstructionWithAccounts,
  type IInstructionWithData,
} from '@solana/web3.js';
import { COMPUTE_BUDGET_PROGRAM_ADDRESS } from '../programs';

export const REQUEST_UNITS_DISCRIMINATOR = 0;

export function getRequestUnitsDiscriminatorBytes() {
  return getU8Encoder().encode(REQUEST_UNITS_DISCRIMINATOR);
}

export type RequestUnitsInstruction<
  TProgram extends string = typeof COMPUTE_BUDGET_PROGRAM_ADDRESS,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<TRemainingAccounts>;

export type RequestUnitsInstructionData = {
  discriminator: number;
  /** Units to request for transaction-wide compute. */
  units: number;
  /** Prioritization fee lamports. */
  additionalFee: number;
};

export type RequestUnitsInstructionDataArgs = {
  /** Units to request for transaction-wide compute. */
  units: number;
  /** Prioritization fee lamports. */
  additionalFee: number;
};

export function getRequestUnitsInstructionDataEncoder(): Encoder<RequestUnitsInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['units', getU32Encoder()],
      ['additionalFee', getU32Encoder()],
    ]),
    (value) => ({ ...value, discriminator: REQUEST_UNITS_DISCRIMINATOR })
  );
}

export function getRequestUnitsInstructionDataDecoder(): Decoder<RequestUnitsInstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['units', getU32Decoder()],
    ['additionalFee', getU32Decoder()],
  ]);
}

export function getRequestUnitsInstructionDataCodec(): Codec<
  RequestUnitsInstructionDataArgs,
  RequestUnitsInstructionData
> {
  return combineCodec(
    getRequestUnitsInstructionDataEncoder(),
    getRequestUnitsInstructionDataDecoder()
  );
}

export type RequestUnitsInput = {
  units: RequestUnitsInstructionDataArgs['units'];
  additionalFee: RequestUnitsInstructionDataArgs['additionalFee'];
};

export function getRequestUnitsInstruction<
  TProgramAddress extends Address = typeof COMPUTE_BUDGET_PROGRAM_ADDRESS,
>(
  input: RequestUnitsInput,
  config?: { programAddress?: TProgramAddress }
): RequestUnitsInstruction<TProgramAddress> {
  // Program address.
  const programAddress =
    config?.programAddress ?? COMPUTE_BUDGET_PROGRAM_ADDRESS;

  // Original args.
  const args = { ...input };

  const instruction = {
    programAddress,
    data: getRequestUnitsInstructionDataEncoder().encode(
      args as RequestUnitsInstructionDataArgs
    ),
  } as RequestUnitsInstruction<TProgramAddress>;

  return instruction;
}

export type ParsedRequestUnitsInstruction<
  TProgram extends string = typeof COMPUTE_BUDGET_PROGRAM_ADDRESS,
> = {
  programAddress: Address<TProgram>;
  data: RequestUnitsInstructionData;
};

export function parseRequestUnitsInstruction<TProgram extends string>(
  instruction: IInstruction<TProgram> & IInstructionWithData<Uint8Array>
): ParsedRequestUnitsInstruction<TProgram> {
  return {
    programAddress: instruction.programAddress,
    data: getRequestUnitsInstructionDataDecoder().decode(instruction.data),
  };
}
