import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17312d",
        muted: "#637672",
        canvas: "#f5f7f3",
        brand: "#176b5f",
        mint: "#d9eee8"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(43, 69, 64, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
