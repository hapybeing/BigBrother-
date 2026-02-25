/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505", 
        surface: "#0a0a0a",
        primary: "#00ffcc", 
        danger: "#ff3366", 
      },
    },
  },
  plugins: [],
}
