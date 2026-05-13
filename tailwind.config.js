/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary:       '#004385',
        teal:          '#0B7A75',
        'teal-dark':   '#19535F',
        'teal-deep':   '#0B4F6C',
        rust:          '#7B2D26',
        sand:          '#D7C9AA',
        offwhite:      '#F0F3F5',
        white:         '#FBFBFF',
        'teal-light':  '#CCDBDC',
        'accent-light':'#CCDBDC',
        navy:          '#000000',
        'navy-soft':   '#0a0a0a',
        'navy-deep':   '#111111',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      animation: {
        'marquee':  'marquee 35s linear infinite',
        'fade-up':  'fadeUp 0.6s ease forwards',
        'tick-up':  'tickUp 0.3s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        marquee:  { '0%': { transform: 'translateX(0%)' },    '100%': { transform: 'translateX(-50%)' } },
        fadeUp:   { '0%': { opacity: 0, transform: 'translateY(24px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        tickUp:   { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        float:    { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-teal': '0 0 30px rgba(11,122,117,0.35)',
        'glow-blue': '0 0 30px rgba(0,67,133,0.35)',
        'card':      '0 4px 24px rgba(4,15,22,0.12)',
        'card-hover':'0 8px 40px rgba(4,15,22,0.20)',
      },
    },
  },
  plugins: [],
};
