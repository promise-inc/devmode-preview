import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DevModePreview } from '@promise-inc/devmode-preview';

const routes = [
  { path: '/', label: 'Home', category: 'Marketing', access: 'public' as const },
  { path: '/pricing', label: 'Pricing', category: 'Marketing', access: 'public' as const },
  { path: '/dashboard', label: 'Dashboard', category: 'App', access: 'private' as const },
];

function App() {
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>DevMode Preview · Vite</h1>
      <p>Click the floating button at the bottom-right to explore the dev companion.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DevModePreview routes={routes} />
  </StrictMode>,
);
