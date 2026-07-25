/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1A1E2E",
          dark: "#121522",
          light: "#252B40",
          muted: "#6B7280",
        },
        saffron: {
          DEFAULT: "#E8830C",
          hover: "#B8650A",
          pale: "#FDF0E0",
          light: "#FFF8F0",
        },
        paper: {
          DEFAULT: "#FAF7F2",
          card: "#FFFFFF",
          border: "#EAE5DC",
        },
        leaf: {
          DEFAULT: "#1D7A4F",
          light: "#E8F5EE",
        },
      },
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
