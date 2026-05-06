/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "anime-dark": "#0d0d1a",
        "anime-darker": "#07070f",
        "anime-card": "#13132a",
        "anime-border": "#2a2a4a",
        "anime-accent": "#6c63ff",
        "anime-pink": "#ff6b9d",
        "anime-cyan": "#00d4ff",
        "anime-green": "#00ff88",
        "anime-yellow": "#ffd700",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
        bangers: ["Impact", "Haettenschweiler", "cursive"],
        nabla: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
