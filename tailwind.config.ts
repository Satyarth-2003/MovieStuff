import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        adda: {
          red: "#ED1C24",
          "red-dark": "#C6181F",
          "red-light": "#FF4D54",
          "red-glow": "rgba(237, 28, 36, 0.35)",
          gold: "#FFB800",
          "gold-dark": "#D97706",
          "gold-light": "#FDE047",
          "gold-glow": "rgba(255, 184, 0, 0.35)",
          dark: "#0B0E14",
          "dark-card": "#121824",
          "dark-surface": "#182030",
          "dark-border": "#222C40",
          purple: "#ED1C24", // Backwards compatibility with adda-purple
        },
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(237, 28, 36, 0.4)",
        "glow-gold": "0 0 25px -5px rgba(255, 184, 0, 0.4)",
        "glow-blue": "0 0 20px -3px rgba(56, 189, 248, 0.4)",
        screen: "0 20px 50px -10px rgba(237, 28, 36, 0.25), 0 0 30px 2px rgba(255, 184, 0, 0.15)",
        card: "0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        serif: ["var(--font-cinzel)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
