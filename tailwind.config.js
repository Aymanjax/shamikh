/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Cairo", "sans-serif"] },
      colors: {
        brand: {
          50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
          400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
          800: "#92400e", 900: "#78350f",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F8FAFC",
          input: "#F1F5F9",
        },
        ink: {
          DEFAULT: "#1E293B",
          muted: "#64748B",
          light: "#94A3B8",
        },
      },
    },
  },
  plugins: [],
};
