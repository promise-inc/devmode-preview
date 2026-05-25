import { useEffect, useMemo, useState } from 'react';
import type { DevModeRoute } from '../../types';
import { IconExternal, IconSearch } from '../../ui/icons';
import { getActiveWindow, navigateActive, onActiveDocumentChange } from '../../core/active-document';

interface RoutesFeatureProps {
  routes: DevModeRoute[];
}

function normalize(route: DevModeRoute): Required<Pick<DevModeRoute, 'path' | 'label' | 'category' | 'access'>> {
  return {
    path: route.path,
    label: route.label ?? route.path,
    category: route.category ?? 'Pages',
    access: route.access ?? 'public',
  };
}

export function RoutesFeature({ routes }: RoutesFeatureProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const refresh = () => {
      try {
        setCurrentPath(getActiveWindow().location.pathname);
      } catch {
        setCurrentPath(window.location.pathname);
      }
    };
    refresh();
    const handler = () => refresh();
    window.addEventListener('popstate', handler);
    const unwatch = onActiveDocumentChange(refresh);
    return () => {
      window.removeEventListener('popstate', handler);
      unwatch();
    };
  }, []);

  const grouped = useMemo(() => {
    const filtered = routes.filter((r) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        r.path.toLowerCase().includes(term) ||
        (r.label ?? '').toLowerCase().includes(term) ||
        (r.category ?? '').toLowerCase().includes(term)
      );
    });

    const map = new Map<string, DevModeRoute[]>();
    for (const route of filtered) {
      const cat = route.category ?? 'Pages';
      const list = map.get(cat) ?? [];
      list.push(route);
      map.set(cat, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [routes, search]);

  const navigate = (path: string) => {
    navigateActive(path);
  };

  if (routes.length === 0) {
    return (
      <div className="dmp-panel">
        <p className="dmp-panel__intro">
          No routes registered. Pass a <code>routes</code> prop or install the Vite/Next plugin
          for auto-discovery.
        </p>
        <div className="dmp-empty">
          <p style={{ margin: 0 }}>No routes to show.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dmp-panel">
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <IconSearch
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--dmp-text-mute)',
          }}
        />
        <input
          type="search"
          className="dmp-input"
          placeholder="Search routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
      </div>

      {grouped.map(([category, items]) => (
        <div key={category} className="dmp-section">
          <p className="dmp-section__title">{category}</p>
          <div className="dmp-stack">
            {items.map((route) => {
              const n = normalize(route);
              const active = n.path === currentPath;
              return (
                <button
                  key={route.path}
                  type="button"
                  className="dmp-route"
                  data-active={active ? 'true' : 'false'}
                  onClick={() => navigate(route.path)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="dmp-route__path">{n.path}</p>
                    <p className="dmp-route__label">{n.label}</p>
                  </div>
                  <span className="dmp-route__badge" data-access={n.access}>
                    {n.access}
                  </span>
                  <IconExternal
                    style={{ color: 'var(--dmp-text-mute)', flex: '0 0 auto' }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
