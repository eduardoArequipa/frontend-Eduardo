/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Esto le dice a Tailwind que escanee todos los archivos .js, .ts, .jsx, .tsx dentro de src/
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}