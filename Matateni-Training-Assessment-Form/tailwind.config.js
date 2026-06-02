/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1c1b34",
          ruby: "#a52a35",
          mist: "#f5f6f8",
          ink: "#202336",
          line: "#d8dce4"
        }
      },
      boxShadow: {
        panel: "0 10px 30px rgba(28, 27, 52, 0.08)",
        header: "0 16px 35px rgba(28, 27, 52, 0.22)"
      }
    }
  },
  plugins: []
};
