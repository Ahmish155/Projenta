/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Lighter, more translucent slate-teal — glass panels over a soft gradient
        base: {
          950: "#2A343A",
          900: "#333F45",
          800: "#3D4A51",
          700: "#4A5960",
          600: "#5A6B72",
          500: "#6B7D85",
        },
        cream: "#F7F4EC",
        muted: "#B9C3C6",
        accent: {
          amber: "#E0AD68",
          green: "#8FC49B",
          red: "#E89A9A",
          blue: "#8FB6D6",
        },
      },
      fontFamily: {
        display: ["'General Sans'", "sans-serif"],
        body: ["'General Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(255,255,255,0.06)",
      },
      keyframes: {
        pulseDot: { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
      },
      animation: { pulseDot: "pulseDot 1.6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
