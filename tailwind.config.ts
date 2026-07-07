import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dualité (cœur de marque)
        cash: "#0A66C2",
        cashInk: "#0747A6",
        cashBg: "#E6F0FA",
        trade: "#C8324A",
        tradeInk: "#9F1F35",
        tradeBg: "#FBE9EC",
        match: "#2E8B57",
        matchInk: "#1F6B40",
        matchBg: "#E6F2EB",
        // Neutres papier kraft chaud
        paper: "#F4EFE6",
        paperSoft: "#FAF7F1",
        paperHard: "#EDE6D8",
        ink: "#1A1814",
        inkSoft: "#3D362E",
        inkMuted: "#7B7065",
        line: "#E2D9C7",
        line2: "#CFC3AB",
        // Sémantique
        success: "#2E8B57",
        warning: "#D97706",
        danger: "#B82135",
        // Motif drapeau algérien
        dzGreen: "#0B8A43",
        dzRed: "#D21034",
        // Alias compat (migration en douceur)
        primary: "#0A66C2",
        secondary: "#2E8B57",
        tradeFg: "#C8324A",
        cashFg: "#0A66C2",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "Space Grotesk",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(26,24,20,0.05)",
        cardHover: "0 12px 32px rgba(26,24,20,0.10)",
        cash: "0 6px 16px rgba(10,102,194,0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
