import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works under any GitHub Pages path
  // (https://<user>.github.io/<repo>/) as well as a custom domain at root.
  base: './',
  plugins: [react()],
});
