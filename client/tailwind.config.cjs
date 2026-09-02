/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
    './components.json',
    './src/app/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  safelist: [
    { pattern: /grid-cols-\[.*\]/ },
    { pattern: /lg:grid-cols-\[.*\]/ },
    { pattern: /\[&_ul\]/ },
    { pattern: /\[&_ol\]/ },
    { pattern: /prose/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
