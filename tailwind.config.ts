import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aeromine brand
        aeromine: {
          50:  "#eef6ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8ec5fe",
          400: "#59a4fc",
          500: "#3382f8",
          600: "#1d62ed",
          700: "#164fda",
          800: "#1840b1",
          900: "#19398c",
          950: "#142356",
        },
        // Sidebar dark
        sidebar: {
          DEFAULT: "#0f172a",
          foreground: "#e2e8f0",
          accent: "#1e293b",
          border: "#1e293b",
        },
        // shadcn-compatible semantic tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Status colours
        status: {
          inprogress: "#3b82f6",
          completed: "#22c55e",
          delayed: "#ef4444",
        },
        // Stage progress colours
        stage: {
          done: "#22c55e",
          active: "#f59e0b",
          pending: "#94a3b8",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
