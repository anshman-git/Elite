import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Order matters: check specific packages before the broad 'react' match.
          if (id.includes('react-calendar-heatmap')) return 'heatmap';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor') || id.includes('decimal.js')) return 'charts';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('canvas-confetti')) return 'confetti';
          // Narrow match to avoid pulling unrelated '*react*' packages (e.g. react-smooth)
          // into react-vendor, which caused a circular chunk (vendor <-> react-vendor).
          if (/node_modules[\\/](react|react-dom|react-is|scheduler)[\\/]/.test(id)) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
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
