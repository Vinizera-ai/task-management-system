/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal com tons de azul/roxo para o efeito aero
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Tons de cinza com transparência para glassmorphism
        glass: {
          50: 'rgba(255, 255, 255, 0.9)',
          100: 'rgba(255, 255, 255, 0.8)',
          200: 'rgba(255, 255, 255, 0.7)',
          300: 'rgba(255, 255, 255, 0.6)',
          400: 'rgba(255, 255, 255, 0.5)',
          500: 'rgba(255, 255, 255, 0.4)',
          600: 'rgba(255, 255, 255, 0.3)',
          700: 'rgba(255, 255, 255, 0.2)',
          800: 'rgba(255, 255, 255, 0.1)',
          900: 'rgba(255, 255, 255, 0.05)',
        },
        // Tons escuros para modo escuro
        dark: {
          50: 'rgba(15, 23, 42, 0.05)',
          100: 'rgba(15, 23, 42, 0.1)',
          200: 'rgba(15, 23, 42, 0.2)',
          300: 'rgba(15, 23, 42, 0.3)',
          400: 'rgba(15, 23, 42, 0.4)',
          500: 'rgba(15, 23, 42, 0.5)',
          600: 'rgba(15, 23, 42, 0.6)',
          700: 'rgba(15, 23, 42, 0.7)',
          800: 'rgba(15, 23, 42, 0.8)',
          900: 'rgba(15, 23, 42, 0.9)',
        }
      },
      backgroundImage: {
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-blue': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
        'gradient-purple': 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
        'aero-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05))',
        'aero-dark': 'linear-gradient(135deg, rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.05))',
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'glass-shine': 'glassShine 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glassShine: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [
    // Plugin personalizado para classes de glassmorphism
    function({ addUtilities }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
        '.glass-dark': {
          background: 'rgba(15, 23, 42, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-strong': {
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.aero-card': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }
      })
    }
  ],
}