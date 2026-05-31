/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FEFBF6',
          100: '#FDF6EC',
          200: '#F5F0E8',
          300: '#E8D5C4',
          400: '#D4A98A',
          500: '#C4956B',
          600: '#E8A87C',
        },
        green: {
          soft: '#7BAE7F',
          warm: '#5B8C5A',
          deep: '#3D6B3D',
          light: '#E8F5E9',
        },
        cream: '#FEFBF6',
        beige: '#F5F0E8',
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
