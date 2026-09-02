import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        adda: {
          purple: "#6c5ce7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
