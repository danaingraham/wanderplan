/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffdf0',
          100: '#fffadb',
          200: '#fff4b8',
          300: '#ffea8a',
          400: '#ffda4d',
          500: '#FFC300', // Main primary color - Golden Yellow
          600: '#e6a800',
          700: '#cc9600',
          800: '#a67c00',
          900: '#805f00',
        },
        secondary: {
          50: '#fff5f3',
          100: '#ffe4e0',
          200: '#ffcec7',
          300: '#ffab9d',
          400: '#ff8574',
          500: '#FF6F61', // Main secondary color - Coral
          600: '#f04438',
          700: '#d93025',
          800: '#b92318',
          900: '#961d13',
        },
        accent: {
          50: '#f0fffe',
          100: '#d4fffc',
          200: '#a8fef9',
          300: '#6bf5ed',
          400: '#30e5da',
          500: '#4ECDC4', // Main accent color - Turquoise
          600: '#24b3a8',
          700: '#1c9188',
          800: '#1a7068',
          900: '#185a53',
        },
        background: '#FDFDFD',
        text: '#333333',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
        'safe-offset-4': 'calc(env(safe-area-inset-bottom) + 1rem)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}