import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  extract: {
    include: ["index.html", "src/**/*.{jsx,tsx}"],
  },
  theme: {
    extend: {
      colors: {
        'gold': '#FFD700',
        'dark-blue': '#1E40AF',
        'dark-gray': '#1A202C',
      },
    },
  },
  plugins: [],
})
