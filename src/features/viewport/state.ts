import type { ViewportPreset } from '../../types';
import { readStorage, writeStorage } from '../../core/storage';
import { mountViewportIframe, unmountViewportIframe } from './iframe';

export const PRESETS: ViewportPreset[] = [
  { id: 'mobile', label: 'Mobile', width: 375 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'full', label: 'Full', width: null },
];

const STORAGE_KEY = 'viewport';

type ViewportId = ViewportPreset['id'];
type Listener = (id: ViewportId) => void;

const listeners = new Set<Listener>();

export function getSavedViewport(): ViewportId {
  return readStorage<ViewportId>(STORAGE_KEY, 'full');
}

function applyViewport(id: ViewportId): void {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset || preset.width === null) {
    unmountViewportIframe();
    return;
  }
  mountViewportIframe(preset.width);
}

export function setViewport(id: ViewportId): void {
  writeStorage(STORAGE_KEY, id);
  applyViewport(id);
  for (const listener of listeners) listener(id);
}

export function applySavedViewport(): void {
  applyViewport(getSavedViewport());
}

export function subscribeViewport(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
