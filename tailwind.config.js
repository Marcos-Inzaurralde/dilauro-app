/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aion: {
          bg: "#070710",
          surface: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.07)",
          text: "#E2E8F0",
          muted: "#475569",
          faint: "#1E293B",
          accent: "#7C3AED",
          "accent-lo": "rgba(124,58,237,0.15)",
          cyan: "#06B6D4",
          green: "#10B981",
          red: "#EF4444",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        glass: "14px",
        xl: "20px",
      },
      animation: {
        dot: "dot 1.2s ease-in-out infinite",
        blink: "blink 0.8s infinite",
        "slide-in": "slideIn 0.2s ease",
      },
      keyframes: {
        dot: {
          "0%, 100%": { opacity: ".2", transform: "scale(.7)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        slideIn: {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
