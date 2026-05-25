# @promise-inc/devmode-preview

**Your in-app dev companion.**
A floating button + drawer that lives in your React app during development — switch viewport, audit SEO, watch Web Vitals, detect trackers, and scan dependencies for known CVEs. Zero config in dev, invisible in production.

<p align="center">
  <img src="https://raw.githubusercontent.com/promise-inc/devmode-preview/main/assets/demo.svg" alt="devmode-preview demo" width="700" />
</p>

## Why?

While building a web app you constantly switch context between:

- The browser DevTools (responsive mode, Lighthouse, network tab)
- A separate tab to validate Open Graph meta with Facebook's Sharing Debugger
- Browser extensions to check Google Tag Manager / Meta Pixel
- Your terminal for `npm audit`
- A spreadsheet of routes to remember what's public vs private

`@promise-inc/devmode-preview` injects a single floating button on every page of your app during development. One click opens a drawer with:

- **Viewport switcher** — instantly try Mobile / Tablet / Desktop / Full widths
- **Route map** — auto-discovered from Next.js App / Pages Router, grouped and marked public/private
- **SEO audit** — live checks for title, description, headings, Open Graph, Twitter Cards, JSON-LD
- **Performance** — real-time Core Web Vitals (LCP, INP, CLS, FCP, TTFB) plus resource breakdown
- **Marketing** — detects GA4, GTM, Meta Pixel, TikTok, Hotjar, Clarity, LinkedIn Insight; parses UTMs; previews Open Graph
- **Dependencies** — scans `package.json` against [OSV.dev](https://osv.dev) for known vulnerabilities

It's strictly dev-only: in `NODE_ENV=production` the component renders `null` and ships nothing to your users (unless you explicitly opt-in for staging previews).

## Install

```bash
yarn add -D @promise-inc/devmode-preview
# or
npm install -D @promise-inc/devmode-preview
# or
pnpm add -D @promise-inc/devmode-preview
```

**Peer dependencies**: `react >= 18`, `react-dom >= 18`.
**Optional**: `next >= 13` or `vite >= 4` for plugin-based auto-discovery.

## Quick Start

### Next.js (App Router)

```tsx
// app/layout.tsx
import { DevModePreview } from '@promise-inc/devmode-preview';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <DevModePreview />
      </body>
    </html>
  );
}
```

Then enable the build-time plugin for route auto-discovery and dependency scanning:

```js
// next.config.js
const { withDevmodePreview } = require('@promise-inc/devmode-preview/next');

module.exports = withDevmodePreview({
  // your existing Next config
});
```

### Vite + React

```tsx
// main.tsx
import { DevModePreview } from '@promise-inc/devmode-preview';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <DevModePreview routes={[
      { path: '/', label: 'Home', category: 'Marketing', access: 'public' },
      { path: '/dashboard', label: 'Dashboard', category: 'App', access: 'private' },
    ]} />
  </>,
);
```

```ts
// vite.config.ts
import { devmodePreview } from '@promise-inc/devmode-preview/vite';

export default defineConfig({
  plugins: [react(), devmodePreview()],
});
```

### Plain React (CRA, Remix, etc.)

```tsx
import { DevModePreview } from '@promise-inc/devmode-preview';
import pkg from '../package.json';

<DevModePreview
  routes={routes}
  packageJson={pkg}
/>
```

## Features

### Viewport Switcher

Quickly constrain the page width to common breakpoints — Mobile (375), Tablet (768), Desktop (1280), or Full (100%). Visual only; for accurate breakpoint behaviour (hover, touch, real media queries) use the browser's Device Mode.

### Routes

Lists every page in your application with category, label, and access level (public / private). On Next.js the build-time plugin auto-discovers routes from `app/` or `pages/` and infers privacy from route group names (`(auth)`, `(private)`, `(protected)`, `(app)`, `(dashboard)`, `(admin)`). You can always override or extend via the `routes` prop.

### SEO

Live audit of the current page DOM, updated automatically as `<head>` changes:

| Check | Threshold |
|-------|-----------|
| `<title>` | Required, ≤ 60 chars |
| `<meta description>` | Required, ≤ 160 chars |
| Single `<h1>` | One per page |
| Heading hierarchy | No skipped levels |
| Image alt attributes | All `<img>` must have `alt` |
| Canonical URL | `<link rel="canonical">` present |
| Open Graph | `og:title`, `og:description`, `og:image`, `og:url`, `og:type` |
| Twitter Cards | `twitter:card`, `twitter:title`, `twitter:image` |
| JSON-LD | Present and parseable |
| HTML lang | `<html lang="...">` set |

### Performance

Real-time Web Vitals collected via the official [`web-vitals`](https://github.com/GoogleChrome/web-vitals) library, plus runtime audit of common pitfalls:

| Metric | Good | Poor |
|--------|------|------|
| LCP | ≤ 2500ms | > 4000ms |
| INP | ≤ 200ms | > 500ms |
| CLS | ≤ 0.1 | > 0.25 |
| FCP | ≤ 1800ms | > 3000ms |
| TTFB | ≤ 800ms | > 1800ms |

Plus: count of images without `loading="lazy"`, blocking scripts in `<head>`, total request count and weight per resource type.

### Marketing

Detects installed analytics and pixel scripts and shows the IDs in use:

| Tracker | Detection |
|---------|-----------|
| Google Analytics 4 | `window.gtag` + `G-*` IDs from `gtag('config', ...)` |
| Google Tag Manager | `GTM-*` IDs from script src and `window.google_tag_manager` |
| Meta Pixel | `window.fbq` + numeric IDs from `fbq('init', ...)` |
| TikTok Pixel | `window.ttq` |
| Hotjar | `window.hj` + `_hjSettings.hjid` |
| Microsoft Clarity | `window.clarity` + project ID |
| LinkedIn Insight | `window._linkedin_data_partner_ids` |
| Mixpanel | `window.mixpanel` |
| Segment | `window.analytics` |
| PostHog | `window.posthog` |

It also parses UTM parameters from the current URL and renders an Open Graph preview.

### Dependencies

Scans `package.json` against the [OSV.dev](https://osv.dev) public API for known vulnerabilities. Each dependency is shown with its installed version and any CVEs grouped by severity (critical / high / medium / low). Results are cached for one hour in `sessionStorage` to avoid hammering the API.

For browser-side scanning to work, install the Vite or Next plugin (recommended) or pass `packageJson` manually.

## API Reference

### `<DevModePreview>` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routes` | `DevModeRoute[]` | `[]` | Manual route list. Merged with auto-discovered routes (manual overrides). |
| `enableInProduction` | `boolean` | `false` | Force render even when `NODE_ENV=production` (use for preview/staging only). |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'auto'` | Initial theme. `auto` follows `prefers-color-scheme`. |
| `disable` | `FeatureKey[]` | `[]` | Hide specific tabs (`viewport`, `routes`, `seo`, `performance`, `marketing`, `deps`). |
| `packageJson` | `PackageJsonShape` | — | Manual `package.json` (only needed without the Vite/Next plugin). |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | FAB anchor. |

### `DevModeRoute`

```ts
interface DevModeRoute {
  path: string;
  label?: string;
  category?: string;
  access?: 'public' | 'private';
  description?: string;
}
```

### Vite plugin

```ts
import { devmodePreview } from '@promise-inc/devmode-preview/vite';

devmodePreview({ disabled?: boolean })
```

Reads `package.json` at dev start and injects it as `globalThis.__DEVMODE_PREVIEW_PKG__` via Vite's `define`.

### Next plugin

```js
const { withDevmodePreview } = require('@promise-inc/devmode-preview/next');

withDevmodePreview(nextConfig, { disabled?: boolean })
```

Wraps your Next config to:

- Scan `app/` or `pages/` directory (with `src/` fallback) and inject routes
- Inject `package.json` for the Dependencies tab
- Skip everything during production builds

## How it works

The component renders a `<devmode-preview-root>` Web Component with an open **Shadow DOM** under `document.body`. All UI lives inside the shadow root, so:

- No CSS from your app can leak into the drawer
- No CSS from the drawer can leak into your app
- Your Tailwind layers, global resets, and CSS-in-JS are unaffected

In production, the entry component checks `process.env.NODE_ENV` and renders `null` unless you explicitly opt in.

## Bundle size

The lib has a single runtime dependency (`web-vitals`, ~2 KB). The production runtime bundle is fully tree-shaken out unless `enableInProduction` is passed.

## How to report bugs

To report a bug, please first read our guide on [opening issues](https://github.com/promise-inc/devmode-preview/issues).

## How to contribute code

To open a pull request, please first read our guide on [opening pull requests](https://github.com/promise-inc/devmode-preview/pulls).

## Also by Promise Inc.

| Package | Description |
|---------|-------------|
| [`@promise-inc/web-guard`](https://github.com/promise-inc/web-guard) | All-in-one web quality guard for CI (Performance, A11y, SEO, Schema, Security, UX) |
| [`@promise-inc/ps-guard`](https://github.com/promise-inc/ps-guard) | Lighthouse-based performance guard |
| [`@promise-inc/ui-states`](https://github.com/promise-inc/ui-states) | Auto-generated skeleton loading states from real DOM |
| [`@promise-inc/dev-reel`](https://github.com/promise-inc/dev-reel) | Animated SVG previews for READMEs — zero JS |
| [`@promise-inc/devlog`](https://github.com/promise-inc/devlog) | Logger with automatic context (file + line) |
| [`@promise-inc/fs-guard`](https://github.com/promise-inc/fs-guard) | Validate project folder and file structure |
| [`@promise-inc/ai-guard`](https://github.com/promise-inc/ai-guard) | Detect AI-generated code patterns |

---

Developed by [Promise Inc.](https://promise.codes)

## License

MIT © [Promise Inc.](https://promise.codes)
