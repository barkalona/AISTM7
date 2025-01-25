import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#59CBE8',
        'neon-blue-glow': 'rgba(89, 203, 232, 0.5)',
        'dark-navy': '#1E293B',
        'dark-black': '#0a0b0f',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 2s infinite',
        'spin-slow': 'spin-slow 6s linear infinite',
        'stream': 'stream 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        stream: {
          '0%': { transform: 'translateX(-100%) rotate(-45deg)' },
          '100%': { transform: 'translateX(100%) rotate(-45deg)' },
        },
        glow: {
          '0%, 100%': {
            textShadow: '0 0 10px rgba(89, 203, 232, 0.5), 0 0 20px rgba(89, 203, 232, 0.5), 0 0 30px rgba(89, 203, 232, 0.5)',
          },
          '50%': {
            textShadow: '0 0 20px rgba(89, 203, 232, 0.5), 0 0 30px rgba(89, 203, 232, 0.5), 0 0 40px rgba(89, 203, 232, 0.5)',
          },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
