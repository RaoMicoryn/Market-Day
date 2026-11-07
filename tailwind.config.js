/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B2545",
          50: "#F4F7FB",
          100: "#E4ECF6",
          200: "#C6D6E9",
          300: "#9BB5D3",
          400: "#5E86B4",
          500: "#2F5C93",
          600: "#1C4374",
          700: "#123257",
          800: "#0B2545",
          900: "#071A33",
        },
        accent: {
          DEFAULT: "#C2410C",
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#EA580C",
          600: "#C2410C",
          700: "#9A3412",
        },
        price: "#9A3412",
        ink: "#101828",
        cream: "#FFFBF5",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Outfit", "Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        market: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,37,69,.04), 0 10px 30px -14px rgba(11,37,69,.16)",
        card: "0 1px 1px rgba(11,37,69,.03), 0 14px 34px -18px rgba(11,37,69,.2)",
        lift: "0 2px 4px rgba(11,37,69,.05), 0 28px 56px -24px rgba(11,37,69,.28)",
        glow: "0 10px 28px -10px rgba(194,65,12,.45)",
        float: "0 -10px 34px -14px rgba(11,37,69,.16), 0 10px 26px -18px rgba(11,37,69,.22)",
        "glow-soft": "0 0 0 1px rgba(194,65,12,.12), 0 8px 24px -12px rgba(194,65,12,.4)",
        innerline: "inset 0 0 0 1px rgba(11,37,69,.06)",
        "top-highlight": "inset 0 1px 0 rgba(255,255,255,.65)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
      },

      keyframes: {
        rise: {
          from: { opacity: 0, transform: "translateY(14px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fade: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        pop: {
          "0%": { opacity: 0, transform: "scale(.94)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        press: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(.82)" },
          "70%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "100% 0" },
          "100%": { backgroundPosition: "-100% 0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(249,115,22,.55)" },
          "50%": { boxShadow: "0 0 0 7px rgba(249,115,22,0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        rise: "rise .5s cubic-bezier(.22,1,.36,1) both",
        fade: "fade .4s ease-out both",
        pop: "pop .25s cubic-bezier(.22,1,.36,1) both",
        press: "press .3s cubic-bezier(.34,1.56,.64,1)",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        glow: "glow 1.8s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};
