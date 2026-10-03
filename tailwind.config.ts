import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F1",
        sand: "#EFE4D5",
        beige: "#E5D5BF",
        tan: "#D8BC9A",
        taupe: "#8A6E52",
        ink: "#0B0B0B",
        line: "#E6DCCD",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Jost", "system-ui", "sans-serif"],
      },
      letterSpacing: { wider2: "0.18em" },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(18px)" }, to: { opacity: "1", transform: "none" } },
        pop: { "0%": { opacity: "0", transform: "scale(.94)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        slideIn: { from: { opacity: "0", transform: "translateX(-16px)" }, to: { opacity: "1", transform: "none" } },
        drop: { from: { opacity: "0", transform: "translateY(-10px)" }, to: { opacity: "1", transform: "none" } },
        checkPop: { "0%": { transform: "scale(.4)", opacity: "0" }, "60%": { transform: "scale(1.12)", opacity: "1" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        "fade-in": "fadeIn .35s ease-out both",
        "fade-up": "fadeUp .8s cubic-bezier(.22,1,.36,1) both",
        pop: "pop .4s cubic-bezier(.22,1,.36,1) both",
        "slide-in": "slideIn .5s cubic-bezier(.22,1,.36,1) both",
        drop: "drop .45s cubic-bezier(.22,1,.36,1) both",
        "check-pop": "checkPop .6s cubic-bezier(.22,1,.36,1) .15s both",
      },
    },
  },
  plugins: [],
};
export default config;
