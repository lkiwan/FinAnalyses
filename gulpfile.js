// gulpfile.js

// 1. Import Gulp and plugins
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const postcss = require('gulp-postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const clean = require('gulp-clean');

// 2. Define file paths for clarity
const paths = {
  html: 'src/**/*.html',
  css: 'src/css/style.css', // We will create this file
  js: 'src/js/**/*.js',
  dist: 'dist'
};

// 3. Create Gulp tasks

// A task to clean the dist folder before a new build
function cleanDist() {
  return gulp.src(paths.dist, { read: false, allowEmpty: true })
    .pipe(clean());
}

// A task to copy and minify HTML files
function html() {
  return gulp.src(paths.html)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(paths.dist));
}

// A task to compile Tailwind CSS

function css() {
  return gulp.src(paths.css)
    .pipe(postcss([
      tailwindcss, // <-- Il suffit de passer la variable tailwindcss directement
      autoprefixer
    ]))
    .pipe(gulp.dest(`${paths.dist}/css`));
}

// A task to minify JavaScript files
function js() {
  return gulp.src(paths.js)
    .pipe(terser())
    .pipe(gulp.dest(`${paths.dist}/js`));
}

// A task to watch for file changes and re-run tasks
function watch() {
  gulp.watch(paths.html, html);
  gulp.watch(['tailwind.config.js', paths.html, paths.css, paths.js], css); // Re-run CSS if config, html, css, or js changes
  gulp.watch(paths.js, js);
}

// 4. Define the main build and default tasks

// The `build` task will run all optimizations for production
const build = gulp.series(cleanDist, gulp.parallel(html, css, js));

// The `default` task will be for development (runs a build and then watches for changes)
const dev = gulp.series(build, watch);

// Export tasks to be used from the command line
exports.html = html;
exports.css = css;
exports.js = js;
exports.clean = cleanDist;
exports.watch = watch;
exports.build = build;
exports.default = dev; // `gulp` command will run the `dev` task