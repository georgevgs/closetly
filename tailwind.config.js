/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#faf8f5",
          dark: "#0e0e0d",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          dark: "#f5f3ef",
        },
        muted: {
          DEFAULT: "#78716c",
          dark: "#a8a29e",
        },
        line: {
          DEFAULT: "#e7e2da",
          dark: "#1f1d1a",
        },
        accent: {
          DEFAULT: "#a85a3b",
          dark: "#d18a6c",
        },
        sage: "#7d8a6a",
        clay: "#c8a78a",
        success: {
          DEFAULT: "#7d8a6a",
          dark: "#9aa685",
        },
        destructive: {
          DEFAULT: "#a85a3b",
          dark: "#d18a6c",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        display: ["PlayfairDisplay", "Georgia"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [],
};
