import { readPackageJson } from '../shared/read-package-json';

interface VitePluginLike {
  name: string;
  enforce?: 'pre' | 'post';
  config: (config: unknown, env: { command: string; mode: string }) => Record<string, unknown> | undefined;
}

interface DevmodePreviewVitePluginOptions {
  disabled?: boolean;
}

export function devmodePreview(options: DevmodePreviewVitePluginOptions = {}): VitePluginLike {
  return {
    name: '@promise-inc/devmode-preview',
    enforce: 'pre',
    config(_config, env) {
      if (options.disabled) return undefined;
      if (env.command !== 'serve' && env.mode !== 'development') return undefined;

      const pkg = readPackageJson(process.cwd());
      if (!pkg) return undefined;

      return {
        define: {
          'globalThis.__DEVMODE_PREVIEW_PKG__': JSON.stringify(pkg),
        },
      };
    },
  };
}

export default devmodePreview;
