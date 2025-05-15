import { env } from 'node:process';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __VERSION__: `"${env.npm_package_version}"`,
  },
  test: {
    // ...
  },
});
