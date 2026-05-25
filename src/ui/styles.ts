export const STYLES = /* css */ `
:host {
  --dmp-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --dmp-mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
  --dmp-radius: 14px;
  --dmp-radius-sm: 8px;
  --dmp-shadow: 0 20px 60px -10px rgba(0,0,0,0.45), 0 8px 16px -6px rgba(0,0,0,0.35);
  --dmp-accent: #b6f23d;
  --dmp-accent-dim: rgba(182,242,61,0.12);
  --dmp-accent-ring: rgba(182,242,61,0.35);
  --dmp-pass: #b6f23d;
  --dmp-warn: #ffb547;
  --dmp-fail: #ff6b6b;
  --dmp-info: #76b3ff;
}

[data-theme="dark"] {
  --dmp-bg: #0d0f10;
  --dmp-bg-elev: #15181a;
  --dmp-bg-soft: #1b1f22;
  --dmp-border: #25292d;
  --dmp-border-soft: #1d2124;
  --dmp-text: #e7ecef;
  --dmp-text-soft: #9aa3aa;
  --dmp-text-mute: #6b7480;
  --dmp-overlay: rgba(0,0,0,0.55);
}

[data-theme="light"] {
  --dmp-bg: #ffffff;
  --dmp-bg-elev: #fafbfc;
  --dmp-bg-soft: #f4f5f7;
  --dmp-border: #e3e6ea;
  --dmp-border-soft: #eef0f3;
  --dmp-text: #0d1115;
  --dmp-text-soft: #4a5560;
  --dmp-text-mute: #788292;
  --dmp-overlay: rgba(13,17,21,0.35);
}

* {
  box-sizing: border-box;
}

.dmp-root, .dmp-root * {
  font-family: var(--dmp-font);
  color: var(--dmp-text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.dmp-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483646;
}

.dmp-root > * {
  pointer-events: auto;
}

/* ---------- FAB ---------- */
.dmp-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 10px 14px;
  background: var(--dmp-bg-elev);
  color: var(--dmp-text);
  border: 1px solid var(--dmp-border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: var(--dmp-shadow);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.dmp-fab:hover {
  transform: translateY(-1px);
  border-color: var(--dmp-accent-ring);
}

.dmp-fab:focus-visible {
  outline: 2px solid var(--dmp-accent-ring);
  outline-offset: 2px;
}

.dmp-fab[data-position="bottom-left"] {
  right: auto;
  left: 20px;
}

.dmp-fab__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--dmp-accent);
  box-shadow: 0 0 0 4px var(--dmp-accent-dim);
  animation: dmp-pulse 2s ease-in-out infinite;
}

@keyframes dmp-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.85; }
}

/* ---------- Overlay + Drawer ---------- */
.dmp-overlay {
  position: fixed;
  inset: 0;
  background: var(--dmp-overlay);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 200ms ease;
}

.dmp-overlay[data-open="true"] {
  opacity: 1;
}

.dmp-drawer {
  position: fixed;
  top: 16px;
  right: 16px;
  bottom: 16px;
  width: min(480px, calc(100vw - 32px));
  background: var(--dmp-bg);
  border: 1px solid var(--dmp-border);
  border-radius: var(--dmp-radius);
  box-shadow: var(--dmp-shadow);
  display: flex;
  flex-direction: column;
  transform: translateX(calc(100% + 24px));
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}

.dmp-drawer[data-open="true"] {
  transform: translateX(0);
}

.dmp-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--dmp-border-soft);
}

.dmp-drawer__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.dmp-drawer__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dmp-iconbtn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--dmp-text-soft);
  border: 1px solid transparent;
  border-radius: var(--dmp-radius-sm);
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}

.dmp-iconbtn:hover {
  background: var(--dmp-bg-soft);
  color: var(--dmp-text);
  border-color: var(--dmp-border-soft);
}

.dmp-iconbtn:focus-visible {
  outline: 2px solid var(--dmp-accent-ring);
  outline-offset: 2px;
}

/* ---------- Tabs ---------- */
.dmp-tabs {
  display: flex;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid var(--dmp-border-soft);
  overflow-x: auto;
  scrollbar-width: none;
}

.dmp-tabs::-webkit-scrollbar { display: none; }

.dmp-tab {
  flex: 0 0 auto;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--dmp-radius-sm);
  color: var(--dmp-text-soft);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms, color 140ms, border-color 140ms;
}

.dmp-tab:hover {
  color: var(--dmp-text);
  background: var(--dmp-bg-soft);
}

.dmp-tab[data-active="true"] {
  color: var(--dmp-text);
  background: var(--dmp-bg-elev);
  border-color: var(--dmp-border);
}

.dmp-tab:focus-visible {
  outline: 2px solid var(--dmp-accent-ring);
  outline-offset: 2px;
}

/* ---------- Panel ---------- */
.dmp-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.dmp-panel__intro {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--dmp-text-soft);
  margin: 0 0 14px;
}

.dmp-panel__footer {
  padding: 10px 16px;
  border-top: 1px solid var(--dmp-border-soft);
  font-family: var(--dmp-mono);
  font-size: 11px;
  color: var(--dmp-text-mute);
}

/* ---------- Section ---------- */
.dmp-section {
  margin-bottom: 18px;
}

.dmp-section__title {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--dmp-text-mute);
  text-transform: uppercase;
  margin: 0 0 10px;
}

/* ---------- Grid ---------- */
.dmp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.dmp-card {
  padding: 14px;
  background: var(--dmp-bg-elev);
  border: 1px solid var(--dmp-border);
  border-radius: var(--dmp-radius-sm);
  cursor: pointer;
  text-align: left;
  transition: border-color 140ms, background 140ms;
}

.dmp-card:hover {
  border-color: var(--dmp-border);
  background: var(--dmp-bg-soft);
}

.dmp-card[data-active="true"] {
  border-color: var(--dmp-accent);
  background: var(--dmp-accent-dim);
}

.dmp-card[data-active="true"] .dmp-card__title {
  color: var(--dmp-accent);
}

.dmp-card__title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 4px;
}

.dmp-card__meta {
  font-size: 11.5px;
  color: var(--dmp-text-soft);
  font-family: var(--dmp-mono);
}

/* ---------- Checklist ---------- */
.dmp-check {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border: 1px solid var(--dmp-border-soft);
  border-radius: var(--dmp-radius-sm);
  margin-bottom: 8px;
  background: var(--dmp-bg-elev);
}

.dmp-check__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.dmp-check__dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 999px;
}

.dmp-check__dot[data-status="pass"] { background: var(--dmp-pass); }
.dmp-check__dot[data-status="warn"] { background: var(--dmp-warn); }
.dmp-check__dot[data-status="fail"] { background: var(--dmp-fail); }
.dmp-check__dot[data-status="info"] { background: var(--dmp-info); }

.dmp-check__body {
  flex: 1;
  min-width: 0;
}

.dmp-check__label {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.dmp-check__value {
  font-size: 12px;
  font-family: var(--dmp-mono);
  color: var(--dmp-text-soft);
  margin: 4px 0 0;
  word-break: break-word;
}

.dmp-check__hint {
  font-size: 12px;
  color: var(--dmp-text-mute);
  margin: 6px 0 0;
  line-height: 1.5;
}

/* ---------- Route item ---------- */
.dmp-route {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--dmp-radius-sm);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 140ms, border-color 140ms;
}

.dmp-route:hover {
  background: var(--dmp-bg-soft);
  border-color: var(--dmp-border-soft);
}

.dmp-route[data-active="true"] {
  background: var(--dmp-accent-dim);
  border-color: var(--dmp-accent);
}

.dmp-route__path {
  font-family: var(--dmp-mono);
  font-size: 11.5px;
  color: var(--dmp-text-mute);
  margin: 0;
}

.dmp-route[data-active="true"] .dmp-route__path {
  color: var(--dmp-accent);
}

.dmp-route__label {
  font-size: 13px;
  font-weight: 500;
  margin: 2px 0 0;
}

.dmp-route__badge {
  margin-left: auto;
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--dmp-border-soft);
  color: var(--dmp-text-mute);
  background: var(--dmp-bg-soft);
}

.dmp-route__badge[data-access="private"] {
  color: var(--dmp-warn);
  border-color: rgba(255,181,71,0.3);
  background: rgba(255,181,71,0.08);
}

/* ---------- Metric ---------- */
.dmp-metric {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--dmp-bg-elev);
  border: 1px solid var(--dmp-border-soft);
  border-radius: var(--dmp-radius-sm);
}

.dmp-metric__label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dmp-text-mute);
  margin: 0;
}

.dmp-metric__value {
  font-family: var(--dmp-mono);
  font-size: 18px;
  font-weight: 600;
  margin: 6px 0 0;
}

.dmp-metric__value[data-status="pass"] { color: var(--dmp-pass); }
.dmp-metric__value[data-status="warn"] { color: var(--dmp-warn); }
.dmp-metric__value[data-status="fail"] { color: var(--dmp-fail); }

.dmp-metric__hint {
  font-size: 11px;
  color: var(--dmp-text-mute);
  margin: 4px 0 0;
}

/* ---------- Search input ---------- */
.dmp-input {
  width: 100%;
  padding: 9px 12px;
  background: var(--dmp-bg-elev);
  border: 1px solid var(--dmp-border-soft);
  border-radius: var(--dmp-radius-sm);
  color: var(--dmp-text);
  font-size: 12.5px;
  font-family: var(--dmp-font);
}

.dmp-input::placeholder {
  color: var(--dmp-text-mute);
}

.dmp-input:focus {
  outline: 2px solid var(--dmp-accent-ring);
  outline-offset: 0;
  border-color: var(--dmp-accent);
}

/* ---------- Empty ---------- */
.dmp-empty {
  text-align: center;
  padding: 28px 12px;
  color: var(--dmp-text-mute);
  font-size: 12.5px;
  border: 1px dashed var(--dmp-border-soft);
  border-radius: var(--dmp-radius-sm);
}

/* ---------- Pill ---------- */
.dmp-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: var(--dmp-bg-soft);
  color: var(--dmp-text-soft);
  border: 1px solid var(--dmp-border-soft);
}

.dmp-pill[data-tone="ok"]   { background: rgba(182,242,61,0.10); color: var(--dmp-pass); border-color: rgba(182,242,61,0.30); }
.dmp-pill[data-tone="warn"] { background: rgba(255,181,71,0.10); color: var(--dmp-warn); border-color: rgba(255,181,71,0.30); }
.dmp-pill[data-tone="bad"]  { background: rgba(255,107,107,0.10); color: var(--dmp-fail); border-color: rgba(255,107,107,0.30); }
.dmp-pill[data-tone="info"] { background: rgba(118,179,255,0.10); color: var(--dmp-info); border-color: rgba(118,179,255,0.30); }

/* ---------- Scrollbar ---------- */
.dmp-panel::-webkit-scrollbar {
  width: 6px;
}
.dmp-panel::-webkit-scrollbar-track {
  background: transparent;
}
.dmp-panel::-webkit-scrollbar-thumb {
  background: var(--dmp-border);
  border-radius: 999px;
}

/* ---------- Row ---------- */
.dmp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--dmp-border-soft);
  border-radius: var(--dmp-radius-sm);
  background: var(--dmp-bg-elev);
  margin-bottom: 6px;
}

.dmp-row__label {
  font-size: 12.5px;
  font-weight: 500;
}

.dmp-row__value {
  font-family: var(--dmp-mono);
  font-size: 11.5px;
  color: var(--dmp-text-soft);
}

/* ---------- Stack ---------- */
.dmp-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dmp-hr {
  border: 0;
  border-top: 1px solid var(--dmp-border-soft);
  margin: 14px 0;
}
`;
