import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { devmodePreview } from '@promise-inc/devmode-preview/vite';

export default defineConfig({
  plugins: [react(), devmodePreview()],
});
