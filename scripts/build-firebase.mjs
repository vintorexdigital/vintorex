// Bundles scripts/firebase-entry.mjs and the firebase package into dist/js/firebase.js. Run: npm run build:firebase
// Commit the result: hosting serves dist/ as-is, and the server does not need node_modules.
import { build } from 'esbuild';

await build({
  entryPoints: ['scripts/firebase-entry.mjs'], outfile: 'dist/js/firebase.js',
  bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'none', logLevel: 'warning',
});
console.log('Built dist/js/firebase.js');
