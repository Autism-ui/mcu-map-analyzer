/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深色背景系统
        'dark': {
          900: '#0a0e1a',
          800: '#0f1420',
          700: '#151b2b',
          600: '#1a2236',
        },
        // 霓虹青色主色调
        'neon': {
          cyan: '#00f5ff',
          amber: '#ffb020',
          green: '#00ff88',
          purple: '#b794f6',
        },
        // 功能色
        'tech': {
          border: 'rgba(0, 245, 255, 0.3)',
          glow: 'rgba(0, 245, 255, 0.5)',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.5)',
        'neon-amber': '0 0 20px rgba(255, 176, 32, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5)',
      },
      animation: {
        'scan-line': 'scanLine 8s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
