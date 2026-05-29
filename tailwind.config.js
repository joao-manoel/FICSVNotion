/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        muted: "#6f6f6f",
        line: "#e8e5df",
        paper: "#fbfaf8",
        accent: "#635bff",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 23, 23, 0.08)",
      },
    },
  },
  plugins: [],
};
