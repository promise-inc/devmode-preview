import type { TrackerInfo } from '../../types';

interface WindowExt {
  gtag?: unknown;
  dataLayer?: Array<{ [k: string]: unknown }>;
  google_tag_manager?: Record<string, unknown>;
  fbq?: { queue?: unknown[] };
  _fbq?: unknown;
  ttq?: unknown;
  hj?: unknown;
  _hjSettings?: { hjid?: number };
  clarity?: unknown;
  _linkedin_data_partner_ids?: string[];
  mixpanel?: unknown;
  analytics?: unknown;
  posthog?: unknown;
}

function w(): WindowExt {
  return window as unknown as WindowExt;
}

function findGtmIds(): string[] {
  const ids = new Set<string>();
  document.querySelectorAll<HTMLScriptElement>('script[src*="googletagmanager.com"]').forEach((s) => {
    const m = s.src.match(/[?&]id=(GTM-[A-Z0-9]+)/);
    if (m?.[1]) ids.add(m[1]);
  });
  const gtmObj = w().google_tag_manager;
  if (gtmObj) {
    for (const key of Object.keys(gtmObj)) {
      if (/^GTM-/.test(key)) ids.add(key);
    }
  }
  return Array.from(ids);
}

function findGaIds(): string[] {
  const ids = new Set<string>();
  document.querySelectorAll<HTMLScriptElement>('script[src*="googletagmanager.com/gtag"]').forEach((s) => {
    const m = s.src.match(/[?&]id=(G-[A-Z0-9]+)/);
    if (m?.[1]) ids.add(m[1]);
  });
  const dl = w().dataLayer ?? [];
  for (const entry of dl) {
    if (Array.isArray(entry) && entry[0] === 'config' && typeof entry[1] === 'string') {
      if (entry[1].startsWith('G-')) ids.add(entry[1]);
    }
  }
  return Array.from(ids);
}

function findMetaPixelIds(): string[] {
  const ids = new Set<string>();
  document.querySelectorAll<HTMLScriptElement>('script').forEach((s) => {
    const m = s.textContent?.match(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,})['"]/);
    if (m?.[1]) ids.add(m[1]);
  });
  return Array.from(ids);
}

function findHotjarId(): string | undefined {
  const id = w()._hjSettings?.hjid;
  return id ? String(id) : undefined;
}

function findClarityId(): string | undefined {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script'));
  for (const s of scripts) {
    const m = s.textContent?.match(/clarity[\s\S]*?["']([a-z0-9]{8,})["']/i);
    if (m?.[1] && s.textContent?.includes('clarity.ms')) return m[1];
  }
  return undefined;
}

export function detectTrackers(): TrackerInfo[] {
  const trackers: TrackerInfo[] = [];

  const gaIds = findGaIds();
  const gtagInstalled = typeof w().gtag === 'function' || gaIds.length > 0;
  trackers.push({
    id: 'ga4',
    name: 'Google Analytics 4',
    installed: gtagInstalled,
    ids: gaIds,
  });

  const gtmIds = findGtmIds();
  trackers.push({
    id: 'gtm',
    name: 'Google Tag Manager',
    installed: gtmIds.length > 0,
    ids: gtmIds,
  });

  const fbIds = findMetaPixelIds();
  trackers.push({
    id: 'meta-pixel',
    name: 'Meta Pixel',
    installed: typeof w().fbq === 'function' || fbIds.length > 0,
    ids: fbIds,
  });

  trackers.push({
    id: 'tiktok',
    name: 'TikTok Pixel',
    installed: typeof w().ttq === 'object' && w().ttq !== null,
  });

  const hjId = findHotjarId();
  trackers.push({
    id: 'hotjar',
    name: 'Hotjar',
    installed: typeof w().hj === 'function' || !!hjId,
    ids: hjId ? [hjId] : [],
  });

  const clarityId = findClarityId();
  trackers.push({
    id: 'clarity',
    name: 'Microsoft Clarity',
    installed: typeof w().clarity === 'function' || !!clarityId,
    ids: clarityId ? [clarityId] : [],
  });

  const li = w()._linkedin_data_partner_ids;
  trackers.push({
    id: 'linkedin',
    name: 'LinkedIn Insight',
    installed: Array.isArray(li) && li.length > 0,
    ids: Array.isArray(li) ? li.map(String) : [],
  });

  trackers.push({
    id: 'mixpanel',
    name: 'Mixpanel',
    installed: typeof w().mixpanel === 'object' && w().mixpanel !== null,
  });

  trackers.push({
    id: 'segment',
    name: 'Segment',
    installed: typeof w().analytics === 'object' && w().analytics !== null,
  });

  trackers.push({
    id: 'posthog',
    name: 'PostHog',
    installed: typeof w().posthog === 'object' && w().posthog !== null,
  });

  return trackers;
}
