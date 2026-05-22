/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
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
          DEFAULT: "var(--bg-card, #FFFFFF)",
          alt: "var(--bg-page, #F0F4F8)",
          input: "var(--bg-input, #F1F5F9)",
          subtle: "var(--bg-subtle, #F8FAFC)",
        },
        ink: {
          DEFAULT: "var(--text-primary, #1E293B)",
          muted: "var(--text-secondary, #64748B)",
          light: "var(--text-light, #94A3B8)",
        },
        line: {
          DEFAULT: "var(--border, #E2E8F0)",
          light: "var(--border-light, rgba(0,0,0,0.04))",
        },
      },
    },
  },
  plugins: [],
};
