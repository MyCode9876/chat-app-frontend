/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        themeDark: {
          bg: '#121118',
          card: '#1d1b26',
          input: '#252330',
          inputBorder: '#333142',
          accent: '#7c3aed',
          accentHover: '#6d28d9',
          textMuted: '#9ca3af',
        },
        themeTeal: {
          light: '#E6F7F0',
          DEFAULT: '#1A9E82',
          dark: '#148E75',
          soft: '#CDEFE2',
        },
        slateDark: {
          DEFAULT: '#1E293B',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('light', '.light &')
    }
  ],
}
