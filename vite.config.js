import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Exclude Firebase service account key from file watching
      deny: ['**/serviceAccountKey.json', '**/*-firebase-adminsdk-*.json']
    }
  }
});
