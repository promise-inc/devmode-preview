import { defineConfig } from 'tsup';

export default defineConfig([
  {
    name: 'client',
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    minify: false,
    target: 'es2020',
    external: ['react', 'react-dom'],
    banner: { js: '"use client";' },
  },
  {
    name: 'plugins',
    entry: {
      'plugins/vite/index': 'src/plugins/vite/index.ts',
      'plugins/next/index': 'src/plugins/next/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    treeshake: true,
    splitting: false,
    minify: false,
    target: 'node18',
    platform: 'node',
    external: ['vite', 'next', 'webpack', 'node:fs', 'node:path'],
  },
]);
