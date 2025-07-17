<<<<<<< Updated upstream
// gulpfile.js - VERSION FINALE CORRIGÉE

const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const postcss = require('gulp-postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const clean = require('gulp-clean');

// Les chemins de fichiers restent les mêmes
const paths = {
  html: 'src/**/*.html',
  css: 'src/css/style.css',
  js: 'src/js/**/*.js',
  dist: 'dist'
};

// La tâche de nettoyage reste la même
function cleanDist() {
  return gulp.src(paths.dist, { read: false, allowEmpty: true })
    .pipe(clean());
}

// La tâche HTML reste la même
function html() {
  return gulp.src(paths.html)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(paths.dist));
}

// --- DÉBUT DE LA CORRECTION ---
// Nous modifions légèrement la tâche CSS pour assurer la compatibilité
function css() {
  // Le 'require' ici s'assure que le fichier de configuration est bien chargé
  // par PostCSS au bon moment, ce qui peut résoudre des problèmes de blocage.
  const tailwindConfig = require('./tailwind.config.js');

  return gulp.src(paths.css)
    .pipe(postcss([
      tailwindcss(tailwindConfig), // On passe explicitement la configuration
      autoprefixer()
    ]))
    .pipe(gulp.dest(`${paths.dist}/css`));
}
// --- FIN DE LA CORRECTION ---

// La tâche JS reste la même
function js() {
  return gulp.src(paths.js)
    .pipe(terser())
    .pipe(gulp.dest(`${paths.dist}/js`));
}

// La tâche de surveillance reste la même
function watch() {
  gulp.watch(paths.html, html);
  gulp.watch(['tailwind.config.js', paths.html, paths.css, paths.js], css);
  gulp.watch(paths.js, js);
}

// Les tâches de build et dev restent les mêmes
const build = gulp.series(cleanDist, gulp.parallel(html, css, js));
const dev = gulp.series(build, watch);

// L'exportation des tâches reste la même
exports.html = html;
exports.css = css;
exports.js = js;
exports.clean = cleanDist;
exports.watch = watch;
exports.build = build;
=======
// gulpfile.js - VERSION FINALE ET CORRECTE

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

// --- DÉBUT DE LA CORRECTION ---
// La fonction CSS corrigée. C'est la seule chose qui a changé.
function css() {
  return gulp.src(paths.css)
    .pipe(postcss([
      tailwindcss, // On passe simplement la variable, sans appeler de fonction
      autoprefixer
    ]))
    .pipe(gulp.dest(`${paths.dist}/css`));
}
// --- FIN DE LA CORRECTION ---

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
>>>>>>> Stashed changes
exports.default = dev;