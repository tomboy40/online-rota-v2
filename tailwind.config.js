/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'calendar': {
          primary: '#1a73e8',    // Primary blue
          secondary: '#f1f3f4',  // Secondary gray
          text: {
            dark: '#3c4043',     // Dark text
            light: '#70757a',    // Light text
          },
          border: '#dadce0',     // Border color
        },
      },
    },
  },
  plugins: [],
}; 