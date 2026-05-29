import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Exclude Firebase service account key and agents directory from file watching
      deny: ['**/serviceAccountKey.json', '**/*-firebase-adminsdk-*.json', '**/.agents/**']
    },
    watch: {
      // Ignore agent dirs, node_modules, and Edge/Chrome browser temp folders that cause EBUSY crashes on Windows
      ignored: ['**/.agents/**', '**/node_modules/**', '**/.edge-*/**', '**/.chrome-*/**']
    }
  }
});
