/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Huge Capital brand colors - Gold/Bronze theme
        brand: {
          50: '#fef9ee',
          100: '#fef3d7',
          200: '#fde3ae',
          300: '#fbcd7a',
          400: '#f9ad44',
          500: '#f7931e', // Main gold
          600: '#e87610',
          700: '#c15810',
          800: '#994515',
          900: '#7b3914',
        },
        // Dark mode backgrounds - Dark gray theme
        dark: {
          bg: '#1a1f2e',      // Dark blue-gray background
          card: '#242938',    // Slightly lighter card
          border: '#2d3548',  // Subtle border
          hover: '#2a3040',   // Hover state
        },
        // Blue accent from Huge Capital website
        blue: {
          primary: '#3b82f6',   // Bright blue
          secondary: '#2563eb', // Deeper blue
          light: '#60a5fa',     // Light blue
        },
      },
    },
  },
  plugins: [],
}
