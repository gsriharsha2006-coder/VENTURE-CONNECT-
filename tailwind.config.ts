import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          deep: "#1E40AF",
          soft: "#DBEAFE",
          ink: "#0F172A"
        }
      },
      boxShadow: {
        premium: "0 18px 55px rgba(15, 23, 42, 0.10)",
        panel: "0 12px 34px rgba(37, 99, 235, 0.12)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "pulse-line": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.9" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-line": "pulse-line 2.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
