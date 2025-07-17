const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const postcss = require('gulp-postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const clean = require('gulp-clean');

const paths = {
  html: 'src/**/*.html',
  css: 'src/css/style.css',
  js: 'src/js/**/*.js',
  dist: 'dist'
};

function cleanDist() {
  return gulp.src(paths.dist, { read: false, allowEmpty: true })
    .pipe(clean());
}

function html() {
  return gulp.src(paths.html)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(paths.dist));
}

function css() {
  return gulp.src(paths.css)
    .pipe(postcss([
      tailwindcss,
      autoprefixer
    ]))
    .pipe(gulp.dest(`${paths.dist}/css`));
}

function js() {
  return gulp.src(paths.js)
    .pipe(terser())
    .pipe(gulp.dest(`${paths.dist}/js`));
}

function watch() {
  gulp.watch(paths.html, html);
  gulp.watch(['tailwind.config.js', paths.html, paths.css, paths.js], css);
  gulp.watch(paths.js, js);
}

const build = gulp.series(cleanDist, gulp.parallel(html, css, js));
const dev = gulp.series(build, watch);

exports.html = html;
exports.css = css;
exports.js = js;
exports.clean = cleanDist;
exports.watch = watch;
exports.build = build;
exports.default = dev;