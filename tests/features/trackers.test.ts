import { afterEach, describe, expect, it } from 'vitest';
import { detectTrackers } from '../../src/features/marketing/trackers';

describe('tracker detection', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (window as unknown as Record<string, unknown>).gtag;
    delete (window as unknown as Record<string, unknown>).dataLayer;
    delete (window as unknown as Record<string, unknown>).fbq;
    delete (window as unknown as Record<string, unknown>).google_tag_manager;
  });

  it('detects GA4 via gtag', () => {
    (window as unknown as Record<string, unknown>).gtag = () => {};
    const trackers = detectTrackers();
    const ga = trackers.find((t) => t.id === 'ga4');
    expect(ga?.installed).toBe(true);
  });

  it('detects GTM via script src', () => {
    document.head.insertAdjacentHTML(
      'beforeend',
      `<script src="https://www.googletagmanager.com/gtm.js?id=GTM-ABC123"></script>`,
    );
    const trackers = detectTrackers();
    const gtm = trackers.find((t) => t.id === 'gtm');
    expect(gtm?.installed).toBe(true);
    expect(gtm?.ids).toContain('GTM-ABC123');
  });

  it('detects Meta Pixel via fbq init', () => {
    document.head.insertAdjacentHTML(
      'beforeend',
      `<script>fbq('init', '1234567890');</script>`,
    );
    const trackers = detectTrackers();
    const meta = trackers.find((t) => t.id === 'meta-pixel');
    expect(meta?.installed).toBe(true);
    expect(meta?.ids).toContain('1234567890');
  });

  it('marks trackers as not installed when absent', () => {
    const trackers = detectTrackers();
    expect(trackers.every((t) => !t.installed)).toBe(true);
  });
});
