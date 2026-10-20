import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { include: ['src/lib/**/*.test.ts'], environment: 'node' },
  build: { rollupOptions: { output: { manualChunks(id) {
    if (!id.includes('/node_modules/')) return;
    if (/\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
    if (id.includes('/@radix-ui/')) return 'ui';
    if (/\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
    if (id.includes('/@tanstack/')) return 'data';
    if (/\/(zod|react-hook-form)\//.test(id) || id.includes('/@hookform/')) return 'forms';
    if (/\/(i18next|react-i18next)\//.test(id)) return 'i18n';
    if (/\/(react-multi-date-picker|react-date-object)\//.test(id)) return 'calendar';
    if (id.includes('/recharts/')) return 'charts';
  } } } },
});
