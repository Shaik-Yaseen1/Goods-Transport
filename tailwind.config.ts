import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0D0F14",
          soft: "#12151C",
          card: "#171B24",
          ring: "#222836",
        },
        accent: {
          DEFAULT: "#F47B1A",
          soft: "#FF9747",
          dim: "#B85A0F",
        },
        ink: {
          DEFAULT: "#E7ECF3",
          mute: "#9AA3B2",
          dim: "#6B7382",
        },
      },
      fontFamily: {
        head: ["var(--font-barlow)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-dm)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(244,123,26,0.4), 0 8px 30px -10px rgba(244,123,26,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
