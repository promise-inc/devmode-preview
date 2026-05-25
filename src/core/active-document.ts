import { getViewportIframe } from '../features/viewport/iframe';

export function getActiveDocument(): Document {
  const iframe = getViewportIframe();
  if (iframe) {
    try {
      const doc = iframe.contentDocument;
      if (doc && (doc.readyState === 'complete' || doc.readyState === 'interactive')) {
        return doc;
      }
    } catch {
      // cross-origin (shouldn't happen — same origin)
    }
  }
  return document;
}

export function getActiveWindow(): Window {
  const iframe = getViewportIframe();
  if (iframe?.contentWindow) {
    try {
      void iframe.contentWindow.location.href;
      return iframe.contentWindow;
    } catch {
      // cross-origin
    }
  }
  return window;
}

export function navigateActive(path: string): void {
  const iframe = getViewportIframe();
  if (iframe) {
    const url = new URL(path, window.location.origin).toString();
    iframe.src = url;
    return;
  }
  window.location.href = path;
}

export function onActiveDocumentChange(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => undefined;

  const handlers: Array<() => void> = [];

  const watchIframe = () => {
    const iframe = getViewportIframe();
    if (!iframe) return;
    const onLoad = () => callback();
    iframe.addEventListener('load', onLoad);
    handlers.push(() => iframe.removeEventListener('load', onLoad));
  };

  watchIframe();

  const observer = new MutationObserver(() => {
    watchIframe();
    callback();
  });
  observer.observe(document.documentElement, { childList: true, subtree: false });
  handlers.push(() => observer.disconnect());

  return () => {
    for (const h of handlers) h();
  };
}
