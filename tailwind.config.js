// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.html', // Scans all HTML files in src
    './src/js/**/*.js',  // Scans all JS files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss'),
    require('autoprefixer')
  ],
}