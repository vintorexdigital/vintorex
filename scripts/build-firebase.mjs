// Bundles scripts/firebase/*.mjs and the firebase package into dist/js/firebase/. Run: npm run build:firebase
// The site has no bundler, so the browser cannot import "firebase/app" itself. The two entries share one chunk
// (the app), so a visitor who only gets Analytics never downloads Auth. Commit the output: hosting serves dist/
// as-is, and the server does not need node_modules.
import { build } from 'esbuild';
import { rmSync } from 'node:fs';

rmSync('dist/js/firebase', { recursive: true, force: true });
await build({
  entryPoints: ['scripts/firebase/analytics.mjs', 'scripts/firebase/auth.mjs'], outdir: 'dist/js/firebase',
  bundle: true, splitting: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'none', logLevel: 'warning',
});
console.log('Built dist/js/firebase/');
