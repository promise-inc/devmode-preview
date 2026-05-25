import { STYLES } from '../ui/styles';

const TAG_NAME = 'devmode-preview-root';

let registered = false;

function registerWebComponent(): void {
  if (registered) return;
  if (typeof customElements === 'undefined') return;
  if (customElements.get(TAG_NAME)) {
    registered = true;
    return;
  }

  class DevModePreviewRoot extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = STYLES;
      shadow.appendChild(style);
      const mount = document.createElement('div');
      mount.setAttribute('data-dmp-mount', '');
      shadow.appendChild(mount);
    }
  }

  customElements.define(TAG_NAME, DevModePreviewRoot);
  registered = true;
}

export interface ShadowMount {
  host: HTMLElement;
  mount: HTMLElement;
  destroy: () => void;
}

export function createShadowMount(): ShadowMount | null {
  if (typeof document === 'undefined') return null;
  registerWebComponent();

  const existing = document.querySelector(TAG_NAME);
  if (existing) existing.remove();

  const host = document.createElement(TAG_NAME);
  host.style.position = 'fixed';
  host.style.zIndex = '2147483646';
  host.style.inset = 'auto';
  document.body.appendChild(host);

  const shadow = host.shadowRoot;
  if (!shadow) {
    host.remove();
    return null;
  }
  const mount = shadow.querySelector<HTMLElement>('[data-dmp-mount]');
  if (!mount) {
    host.remove();
    return null;
  }

  return {
    host,
    mount,
    destroy: () => {
      host.remove();
    },
  };
}
