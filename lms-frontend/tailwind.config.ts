import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      brand: 'rgb(var(--brand) / <alpha-value>)',
      amber: 'rgb(var(--amber) / <alpha-value>)',
      ink: 'rgb(var(--ink) / <alpha-value>)',
      canvas: 'rgb(var(--canvas) / <alpha-value>)',
      surface: 'rgb(var(--surface) / <alpha-value>)',
    },
    boxShadow: { soft: '0 8px 32px -12px rgb(17 24 39 / 0.12)' },
    fontFamily: { sans: ['Inter Variable', 'sans-serif'], dari: ['Vazirmatn Variable', 'sans-serif'] },
  } },
  plugins: [],
} satisfies Config;
