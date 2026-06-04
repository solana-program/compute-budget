#!/usr/bin/env zx
import 'zx/globals';
import { cliArguments, workingDirectory } from '../utils.mjs';

// Build the client and run the tests (LiteSVM, no validator required).
cd(path.join(workingDirectory, 'clients', 'js'));
await $`pnpm install`;
await $`pnpm build`;
await $`pnpm test ${cliArguments()}`;
