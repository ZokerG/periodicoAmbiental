// @ts-check
import { defineConfig } from 'astro/config';

// BASE_PATH: dónde queda publicada la web.
//  - Cloudflare Pages o dominio propio: no lo definas (queda "/").
//  - GitHub Pages de proyecto (usuario.github.io/mi-repo/): BASE_PATH=/mi-repo npm run build
export default defineConfig({
  output: 'static',
  // Conserva los espacios entre texto y etiquetas en línea (<strong>, <a>).
  compressHTML: false,
  base: process.env.BASE_PATH ?? '/',
});
