import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    fontSize: {
      xs: ['0.6875rem', '1.5'], sm: ['0.75rem', '1.6'], base: ['0.75rem', '1.65'],
      lg: ['0.8125rem', '1.6'], xl: ['0.875rem', '1.5'], '2xl': ['1rem', '1.4'],
      '3xl': ['1.125rem', '1.35'], '4xl': ['1.375rem', '1.3'],
      '5xl': ['1.625rem', '1.25'], '6xl': ['1.875rem', '1.2'],
    },
    colors: {
      brand: 'rgb(var(--brand) / <alpha-value>)',
      'brand-action': 'rgb(var(--brand-action) / <alpha-value>)',
      'brand-action-hover': 'rgb(var(--brand-action-hover) / <alpha-value>)',
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
