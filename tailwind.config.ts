import type { Config } from 'tailwindcss';
import { THEME_TOKENS } from './config/themes.config';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './backend/**/*.{js,ts,jsx,tsx}',
    './**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      // 8px Grid System из централизованной конфигурации
      spacing: Object.fromEntries(
        Object.entries(THEME_TOKENS.spacing).map(([key, value]) => [
          key,
          `var(--spacing-${key})`
        ])
      ),
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      // Typography из централизованной конфигурации
      fontSize: Object.fromEntries(
        Object.entries(THEME_TOKENS.fontSize).map(([key, value]) => [
          key,
          [`var(--text-${key})`, { lineHeight: 'var(--leading-normal)' }]
        ])
      ),
      fontWeight: Object.fromEntries(
        Object.entries(THEME_TOKENS.fontWeight).map(([key, value]) => [
          key,
          `var(--font-weight-${key})`
        ])
      ),
      letterSpacing: Object.fromEntries(
        Object.entries(THEME_TOKENS.letterSpacing).map(([key, value]) => [
          key,
          `var(--letter-spacing-${key})`
        ])
      ),
      colors: {
        // Основные цвета из CSS переменных
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Поверхности
        surface: "hsl(var(--surface))",
        'surface-accent': "hsl(var(--surface-accent))",
        'surface-hover': "hsl(var(--surface-hover))",
        'surface-elevated': "hsl(var(--surface-elevated))",
        'surface-subtle': "hsl(var(--surface-subtle))",
        
        // Основные цвета
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        // Семантические цвета
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          light: "hsl(var(--warning-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          light: "hsl(var(--destructive-light))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          light: "hsl(var(--info-light))",
          subtle: "hsl(var(--info-subtle))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          light: "hsl(var(--muted-light))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          light: "hsl(var(--accent-light))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Текстовые цвета
        'text-primary': "var(--text-primary)",
        'text-secondary': "var(--text-secondary)",
        'text-muted': "var(--text-muted)",
        'text-subtle': "var(--text-subtle)",
        'text-inverse': "var(--text-inverse)",
        'text-accent': "var(--text-accent)",
        'text-success': "var(--text-success)",
        'text-warning': "var(--text-warning)",
        'text-error': "var(--text-error)",
        
        // Финансовые цвета из CSS переменных
        'financial-profit': "hsl(var(--profit))",
        'financial-loss': "hsl(var(--loss))",
        'financial-neutral': "hsl(var(--neutral))",
        'financial-growth': "hsl(var(--growth))",
        'financial-decline': "hsl(var(--decline))",
        
        // Цвета графиков
        'chart-primary': "hsl(var(--chart-primary))",
        'chart-secondary': "hsl(var(--chart-secondary))",
        'chart-tertiary': "hsl(var(--chart-tertiary))",
        'chart-quaternary': "hsl(var(--chart-quaternary))",
        'chart-accent': "hsl(var(--chart-accent))",
        'chart-muted': "hsl(var(--chart-muted))",
        
        // Дополнительные цвета графиков для совместимости
        'chart-1': "var(--chart-1)",
        'chart-2': "var(--chart-2)",
        'chart-3': "var(--chart-3)",
        'chart-4': "var(--chart-4)",
        'chart-5': "var(--chart-5)",
        'chart-6': "var(--chart-6)",
        
        // Фоновые цвета страниц
        'page-dashboard': "hsl(var(--page-dashboard))",
        'page-analytics': "hsl(var(--page-analytics))",
        'page-transactions': "hsl(var(--page-transactions))",
        'page-reports': "hsl(var(--page-reports))",
        'page-settings': "hsl(var(--page-settings))",
      },
      backgroundImage: {
        // Gradients removed - replaced with solid colors
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