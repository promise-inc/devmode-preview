import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DevModeRoute } from '../../types';
import { readPackageJson } from '../shared/read-package-json';
import { scanAppRouter, scanPagesRouter } from '../shared/scan-routes';

interface WebpackConfigShape {
  plugins?: unknown[];
}

interface DefinePluginCtor {
  new (definitions: Record<string, string>): unknown;
}

interface NextWebpackContext {
  dev: boolean;
  webpack: { DefinePlugin: DefinePluginCtor };
}

interface NextConfigShape {
  webpack?: (
    config: WebpackConfigShape,
    ctx: NextWebpackContext,
  ) => WebpackConfigShape;
}

interface DevmodePreviewNextOptions {
  disabled?: boolean;
}

function discoverRoutes(cwd: string): DevModeRoute[] {
  const appDir = join(cwd, 'app');
  const srcAppDir = join(cwd, 'src', 'app');
  const pagesDir = join(cwd, 'pages');
  const srcPagesDir = join(cwd, 'src', 'pages');

  if (existsSync(appDir)) return scanAppRouter(appDir);
  if (existsSync(srcAppDir)) return scanAppRouter(srcAppDir);
  if (existsSync(pagesDir)) return scanPagesRouter(pagesDir);
  if (existsSync(srcPagesDir)) return scanPagesRouter(srcPagesDir);
  return [];
}

export function withDevmodePreview(
  nextConfig: NextConfigShape = {},
  options: DevmodePreviewNextOptions = {},
): NextConfigShape {
  if (options.disabled) return nextConfig;

  const userWebpack = nextConfig.webpack;

  return {
    ...nextConfig,
    webpack(config: WebpackConfigShape, ctx: NextWebpackContext) {
      if (!ctx.dev) {
        return userWebpack ? userWebpack(config, ctx) : config;
      }

      const pkg = readPackageJson(process.cwd());
      const routes = discoverRoutes(process.cwd());

      if (!config.plugins) config.plugins = [];
      config.plugins.push(
        new ctx.webpack.DefinePlugin({
          'globalThis.__DEVMODE_PREVIEW_PKG__': JSON.stringify(pkg ?? null),
          'globalThis.__DEVMODE_PREVIEW_ROUTES__': JSON.stringify(routes),
        }),
      );

      return userWebpack ? userWebpack(config, ctx) : config;
    },
  };
}

export default withDevmodePreview;
