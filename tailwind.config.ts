import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Cores por variável (src/index.css): o Neo360 usa a paleta do protótipo Boa Vista; o painel e o admin
      // (.theme-sys) usam a da referência de layout em resources/design_tela.jpg (ADR-0013).
      colors: {
        cream: { DEFAULT: "rgb(var(--c-cream) / <alpha-value>)", card: "rgb(var(--c-cream-card) / <alpha-value>)" },
        ink: { DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", muted: "rgb(var(--c-ink-muted) / <alpha-value>)" },
        forest: { DEFAULT: "rgb(var(--c-forest) / <alpha-value>)", soft: "rgb(var(--c-forest-soft) / <alpha-value>)", deep: "rgb(var(--c-forest-deep) / <alpha-value>)" },
        teal: { DEFAULT: "rgb(var(--c-teal) / <alpha-value>)", soft: "rgb(var(--c-teal-soft) / <alpha-value>)" },
        gold: { DEFAULT: "rgb(var(--c-gold) / <alpha-value>)", soft: "rgb(var(--c-gold-soft) / <alpha-value>)" },
        ok: "rgb(var(--c-ok) / <alpha-value>)",
        coral: { DEFAULT: "rgb(var(--c-coral) / <alpha-value>)", soft: "rgb(var(--c-coral-soft) / <alpha-value>)" },
        line: "rgb(var(--c-line) / <alpha-value>)",
        whatsapp: "#25D366",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "var(--sh-soft)",
        lift: "var(--sh-lift)",
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "60%": { transform: "scale(1.15)" }, "100%": { transform: "scale(1)", opacity: "1" } },
        ping: { "75%,100%": { transform: "scale(2.2)", opacity: "0" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        rise: "rise .45s cubic-bezier(.2,.8,.2,1) both",
        pop: "pop .35s cubic-bezier(.2,.8,.2,1) both",
        ping: "ping 1.6s cubic-bezier(0,0,.2,1) infinite",
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
