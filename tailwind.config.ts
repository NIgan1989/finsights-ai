import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './backend/**/*.{js,ts,jsx,tsx}',
    './**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // 8px Grid System
      spacing: {
        '0': 'var(--spacing-0)',
        '1': 'var(--spacing-1)',
        '2': 'var(--spacing-2)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '10': 'var(--spacing-10)',
        '12': 'var(--spacing-12)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
        '24': 'var(--spacing-24)',
        '32': 'var(--spacing-32)',
        '40': 'var(--spacing-40)',
        '48': 'var(--spacing-48)',
        '64': 'var(--spacing-64)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      fontSize: {
        '2xs': ['var(--text-2xs)', { lineHeight: 'var(--leading-snug)' }],
        'xs': ['var(--text-xs)', { lineHeight: 'var(--leading-snug)' }],
        'sm': ['var(--text-sm)', { lineHeight: 'var(--leading-snug)' }],
        'base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        'lg': ['var(--text-lg)', { lineHeight: 'var(--leading-normal)' }],
        'xl': ['var(--text-xl)', { lineHeight: 'var(--leading-tight)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
        '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-none)' }],
        '6xl': ['var(--text-6xl)', { lineHeight: 'var(--leading-none)' }]
      },
      fontWeight: {
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
        extrabold: 'var(--font-weight-extrabold)'
      },
      letterSpacing: {
        tight: 'var(--letter-spacing-tight)',
        normal: 'var(--letter-spacing-normal)',
        wide: 'var(--letter-spacing-wide)',
        wider: 'var(--letter-spacing-wider)',
        widest: 'var(--letter-spacing-widest)'
      },
      colors: {
        // Используем CSS переменные для совместимости с существующими стилями
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-accent': 'var(--surface-accent)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)'
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)'
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)'
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)'
        }
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)'
      },
      boxShadow: {
        'neumorphism': 'var(--shadow-neumorphism)',
        'neumorphism-inset': 'var(--shadow-neumorphism-inset)',
        'card': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
        'glow': 'var(--shadow-glow)'
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms'
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      animation: {
        'tilt': 'tilt 10s infinite linear',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        tilt: {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)'
          },
          '25%': {
            transform: 'rotate(0.5deg)'
          },
          '75%': {
            transform: 'rotate(-0.5deg)'
          }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          }
        },
        scaleIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.95)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1)' 
          }
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.2), 0 0 10px rgba(59, 130, 246, 0.2), 0 0 15px rgba(59, 130, 246, 0.2)'
          },
          '100%': {
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.4)'
          }
        }
      }
    }
  },
  plugins: []
};

export default config;