import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // La extracción de RAR lee el .wasm desde node_modules: hay que incluirlo en el bundle de Vercel.
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/node-unrar-js/dist/js/unrar.wasm'],
    // "Cómo funciona la IA" lee las métricas de evaluación en tiempo de ejecución.
    '/como-funciona': ['./demo-assets/eval-resultado.json'],
  },
  serverExternalPackages: ['node-unrar-js', 'word-extractor'],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
