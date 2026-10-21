import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {
    colors: {
      arena: { bg: '#090D12', surface: '#0F1620', raised: '#141D2B', border: '#1C293A', text: '#F1F5F9', muted: '#7D8D9E', green: '#00FF87', cyan: '#00E5FF', ruby: '#FF3366', amber: '#FFB800' }
    },
    fontFamily: { display: ['Space Grotesk', 'sans-serif'], body: ['Geist', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
    boxShadow: { glow: '0 0 24px rgba(0,255,135,.14)', 'cyan-glow': '0 0 24px rgba(0,229,255,.12)' }
  } }, plugins: []
};
export default config;
