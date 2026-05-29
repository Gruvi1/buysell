import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        muted: "#667085",
        surface: "#f7f7f4",
        line: "#deded8",
        accent: "#0f766e",
      },
      boxShadow: {
        soft: "0 18px 48px rgba(23, 32, 42, 0.08)",
        premium: "0 24px 80px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
