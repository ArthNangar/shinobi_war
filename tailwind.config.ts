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
        ninja: {
          bg: "#0B0F19",
          card: "#131A2A",
          border: "#1E293B",
          accent: "#00F2FE",
          fire: "#FF2E63",
          lightning: "#9D4EDD",
          sage: "#FFB703",
          water: "#00B4D8",
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite alternate',
        'chakra-flow': 'chakraFlow 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 242, 254, 0.8), 0 0 35px rgba(0, 242, 254, 0.4)' },
        },
        chakraFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
    },
  },
  plugins: [],
};
export default config;
