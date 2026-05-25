export type RouteAccess = 'public' | 'private';

export interface DevModeRoute {
  path: string;
  label?: string;
  category?: string;
  access?: RouteAccess;
  description?: string;
}

export type ThemeMode = 'dark' | 'light' | 'auto';

export type FeatureKey =
  | 'viewport'
  | 'routes'
  | 'seo'
  | 'performance'
  | 'marketing'
  | 'deps';

export interface PackageJsonShape {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface DevModePreviewProps {
  routes?: DevModeRoute[];
  enableInProduction?: boolean;
  theme?: ThemeMode;
  disable?: FeatureKey[];
  packageJson?: PackageJsonShape;
  position?: 'bottom-right' | 'bottom-left';
}

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface ChecklistResult {
  id: string;
  label: string;
  status: CheckStatus;
  value?: string;
  hint?: string;
}

export interface ViewportPreset {
  id: 'mobile' | 'tablet' | 'desktop' | 'full';
  label: string;
  width: number | null;
}

export interface TrackerInfo {
  id: string;
  name: string;
  installed: boolean;
  ids?: string[];
  lastEvent?: { name: string; at: number };
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface DepEntry {
  name: string;
  current: string;
  latest?: string;
  publishedAt?: string;
  type: 'prod' | 'dev';
  vulns: DepVuln[];
  outdated: 'major' | 'minor' | 'patch' | 'ahead' | null;
}

export interface DepVuln {
  id: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  url?: string;
}
