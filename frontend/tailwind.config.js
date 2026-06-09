/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#1a1200",
          100: "#2a1e00",
          400: "#D4A843",
          500: "#C9A84C",
          600: "#B8942A",
          700: "#1c1400",
          900: "#0a0a0a",
        },
      },
      boxShadow: {
        gold:    "0 2px 20px rgba(201,168,76,0.12), 0 0 0 1px rgba(201,168,76,0.06)",
        "gold-lg": "0 4px 32px rgba(201,168,76,0.18)",
      },
    },
  },
  plugins: [],
};
