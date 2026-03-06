/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#000000',
          elevated: 'rgb(10 10 10)',
          muted: 'rgb(22 22 24)',
        },
        // Epistle brand: black-and-white palette, reverent and quiet (joinepistle.com)
        primary: {
          DEFAULT: '#ffffff',
          hover: 'rgb(240 240 240)',
          muted: 'rgba(255 255 255 / 0.08)',
        },
      },
    },
  },
  plugins: [],
};
