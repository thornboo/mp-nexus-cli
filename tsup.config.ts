import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    nexus: 'src/bin/nexus.ts',
  },
  format: ['cjs'],
  target: 'node18',
  clean: true,
  sourcemap: false,
  dts: false,
  shims: false,
  platform: 'node',
  banner: {
    js: '#!/usr/bin/env node',
  },
});


