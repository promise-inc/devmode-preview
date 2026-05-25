import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PackageJsonShape } from '../../types';

export function readPackageJson(cwd: string): PackageJsonShape | null {
  try {
    const raw = readFileSync(join(cwd, 'package.json'), 'utf-8');
    const parsed = JSON.parse(raw) as PackageJsonShape;
    return {
      name: parsed.name,
      version: parsed.version,
      dependencies: parsed.dependencies,
      devDependencies: parsed.devDependencies,
    };
  } catch {
    return null;
  }
}
