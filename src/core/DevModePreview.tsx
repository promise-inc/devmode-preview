import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DevModePreviewProps, DevModeRoute, FeatureKey, ThemeMode } from '../types';
import { Drawer } from '../ui/Drawer';
import { Fab } from '../ui/Fab';
import { Tabs } from '../ui/Tabs';
import { ViewportFeature } from '../features/viewport';
import { RoutesFeature } from '../features/routes';
import { SeoFeature } from '../features/seo';
import { PerformanceFeature } from '../features/performance';
import { MarketingFeature } from '../features/marketing';
import { DepsFeature } from '../features/deps';
import { createShadowMount, type ShadowMount } from './shadow-root';
import { getInitialTheme, persistTheme, resolveTheme, watchSystemTheme } from './theme';
import { shouldRender } from './env';
import { applySavedViewport } from '../features/viewport/state';
import { unmountViewportIframe } from '../features/viewport/iframe';

declare global {
  var __DEVMODE_PREVIEW_ROUTES__: DevModeRoute[] | undefined;
}

function mergeRoutes(propRoutes: DevModeRoute[]): DevModeRoute[] {
  const auto =
    typeof globalThis !== 'undefined' && Array.isArray(globalThis.__DEVMODE_PREVIEW_ROUTES__)
      ? globalThis.__DEVMODE_PREVIEW_ROUTES__
      : [];
  if (auto.length === 0) return propRoutes;
  if (propRoutes.length === 0) return auto;

  const map = new Map<string, DevModeRoute>();
  for (const r of auto) map.set(r.path, r);
  for (const r of propRoutes) {
    const existing = map.get(r.path);
    map.set(r.path, { ...existing, ...r });
  }
  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}

const TAB_DEFS: Array<{ id: FeatureKey; label: string; full: string }> = [
  { id: 'viewport', label: 'Viewport', full: 'Viewport' },
  { id: 'routes', label: 'Routes', full: 'Routes' },
  { id: 'seo', label: 'SEO', full: 'SEO' },
  { id: 'performance', label: 'Perf', full: 'Performance' },
  { id: 'marketing', label: 'Tags', full: 'Marketing / Trackers' },
  { id: 'deps', label: 'Deps', full: 'Dependencies' },
];

const THEME_CYCLE: ThemeMode[] = ['auto', 'dark', 'light'];

export function DevModePreview(props: DevModePreviewProps) {
  const {
    routes = [],
    enableInProduction = false,
    theme: initialTheme = 'auto',
    disable = [],
    packageJson,
    position = 'bottom-right',
  } = props;

  const [mountInfo, setMountInfo] = useState<ShadowMount | null>(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => initialTheme);
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark');

  const tabs = useMemo(() => TAB_DEFS.filter((t) => !disable.includes(t.id)), [disable]);
  const [activeTab, setActiveTab] = useState<FeatureKey>(tabs[0]?.id ?? 'viewport');
  const mergedRoutes = useMemo(() => mergeRoutes(routes), [routes]);

  useEffect(() => {
    if (!shouldRender(enableInProduction)) return undefined;

    const info = createShadowMount();
    if (!info) return undefined;
    setMountInfo(info);
    setTheme(getInitialTheme(initialTheme));
    applySavedViewport();

    return () => {
      info.destroy();
      unmountViewportIframe();
      setMountInfo(null);
    };
  }, [enableInProduction, initialTheme]);

  useEffect(() => {
    if (!mountInfo) return undefined;
    const apply = (t: ThemeMode) => {
      const r = resolveTheme(t);
      setResolved(r);
      mountInfo.host.setAttribute('data-theme', r);
    };
    apply(theme);
    if (theme === 'auto') {
      return watchSystemTheme((sys) => {
        setResolved(sys);
        mountInfo.host.setAttribute('data-theme', sys);
      });
    }
    return undefined;
  }, [theme, mountInfo]);

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length] ?? 'auto';
    setTheme(next);
    persistTheme(next);
  };

  if (!mountInfo) return null;

  const renderPanel = () => {
    switch (activeTab) {
      case 'viewport':
        return <ViewportFeature />;
      case 'routes':
        return <RoutesFeature routes={mergedRoutes} />;
      case 'seo':
        return <SeoFeature />;
      case 'performance':
        return <PerformanceFeature />;
      case 'marketing':
        return <MarketingFeature />;
      case 'deps':
        return <DepsFeature packageJson={packageJson} />;
      default:
        return null;
    }
  };

  return createPortal(
    <div className="dmp-root" data-theme={resolved}>
      {!open && <Fab onClick={() => setOpen(true)} position={position} />}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        theme={theme}
        onCycleTheme={cycleTheme}
        footer={<span>Persisted in localStorage · dev only</span>}
      >
        <Tabs tabs={tabs} active={activeTab} onSelect={setActiveTab} />
        {renderPanel()}
      </Drawer>
    </div>,
    mountInfo.mount,
  );
}
