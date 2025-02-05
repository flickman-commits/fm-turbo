/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'turbo-beige': '#F5F0E8',
        'turbo-blue': '#4169E1',
        'turbo-coral': '#E94E1B',
        'turbo-green': '#4CAF50',
        'turbo-black': '#000000',
        // System Colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        'color-1': 'hsl(var(--color-1))',
        'color-2': 'hsl(var(--color-2))',
        'color-3': 'hsl(var(--color-3))',
        'color-4': 'hsl(var(--color-4))',
        'color-5': 'hsl(var(--color-5))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      animation: {
        'wave-pulse': 'wave-pulse 4s ease-in-out infinite',
        rainbow: 'rainbow var(--speed, 2s) infinite linear',
        'rainbow-border': 'rainbow-border 2s linear infinite',
      },
      keyframes: {
        'wave-pulse': {
          '0%, 100%': {
            opacity: 0.4
          },
          '50%': {
            opacity: 0.7
          }
        },
        rainbow: {
          '0%': {
            'background-position': '0%'
          },
          '100%': {
            'background-position': '200%'
          }
        },
        'rainbow-border': {
          '0%': {
            'border-image-source': 'linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)',
            'border-image-slice': '1'
          },
          '100%': {
            'border-image-source': 'linear-gradient(225deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)',
            'border-image-slice': '1'
          }
        }
      },
      backgroundImage: {
        'dots-pattern': 'radial-gradient(transparent 1px, white 1px)',
        'dots-pattern-dark': 'radial-gradient(transparent 1px, rgb(0 0 0) 1px)'
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      addUtilities({
        '.rainbow-glow': {
          'box-shadow': `
            0 0 20px rgba(255, 0, 0, 0.03),
            0 0 40px rgba(255, 127, 0, 0.03),
            0 0 60px rgba(255, 255, 0, 0.03),
            0 0 80px rgba(0, 255, 0, 0.03),
            0 0 100px rgba(0, 127, 255, 0.03),
            0 0 120px rgba(127, 0, 255, 0.03)
          `
        }
      })
    },
    require("@tailwindcss/typography")
  ],
} 