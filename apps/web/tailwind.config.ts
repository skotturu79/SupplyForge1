import type { Config } from 'tailwindcss';
import path from 'path';

// fast-glob (used by Tailwind for content scanning) requires forward slashes on Windows.
// Convert __dirname backslashes → forward slashes so glob patterns resolve correctly.
const base = __dirname.replace(/\\/g, '/');

const config: Config = {
  content: [
    `${base}/src/pages/**/*.{js,ts,jsx,tsx,mdx}`,
    `${base}/src/components/**/*.{js,ts,jsx,tsx,mdx}`,
    `${base}/src/app/**/*.{js,ts,jsx,tsx,mdx}`,
  ],
  theme: {
    extend: {
      colors: {
        // SAP Fiori semantic color tokens
        fiori: {
          shell:    '#354A5E',
          brand:    '#0070F2',
          bg:       '#F5F6F7',
          text:     '#32363A',
          subtle:   '#6A6D70',
          border:   '#EDEDED',
          positive: '#107E3E',
          critical: '#E9730C',
          negative: '#BB0000',
          info:     '#0A6ED1',
        },
        brand: {
          50:  '#EAF3FF',
          100: '#D3E8FD',
          200: '#A8D2FB',
          500: '#0070F2',
          600: '#0064D9',
          700: '#0057C2',
          900: '#003EA6',
        },
      },
      fontFamily: {
        sans: ['72', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        tile: '0 1px 4px rgba(0,0,0,0.08)',
        shell: '0 2px 6px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
