/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./backend/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          hover: 'hsl(var(--color-primary-hover))',
          foreground: 'hsl(var(--color-primary-foreground))'
        },
        background: 'hsl(var(--color-background))',
        surface: {
          DEFAULT: 'hsl(var(--color-surface))',
          accent: 'hsl(var(--color-surface-accent))'
        },
        border: 'hsl(var(--color-border))',
        text: {
          primary: 'hsl(var(--color-text-primary))',
          secondary: 'hsl(var(--color-text-secondary))',
          disabled: 'hsl(var(--color-text-disabled))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-destructive))',
          foreground: 'hsl(var(--color-destructive-foreground))'
        },
        success: {
          DEFAULT: 'hsl(var(--color-success))',
          foreground: 'hsl(var(--color-success-foreground))'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
        '4xl': '0 45px 80px -15px rgba(0, 0, 0, 0.3)'
      }
    }
  },
  plugins: []
};