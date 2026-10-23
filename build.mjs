import { build } from "esbuild";
import { mkdir } from "node:fs/promises";

await mkdir("dist/ui", { recursive: true });

const defaults = {
  bundle: true,
  format: "esm",
  target: "es2022",
  logLevel: "info",
};

await Promise.all([
  build({
    ...defaults,
    entryPoints: ["src/manifest.ts"],
    platform: "node",
    outfile: "dist/manifest.js",
    packages: "external",
  }),
  build({
    ...defaults,
    entryPoints: ["src/worker.ts"],
    platform: "node",
    target: "node24",
    outfile: "dist/worker.js",
    packages: "external",
  }),
  build({
    ...defaults,
    entryPoints: ["src/ui/index.tsx"],
    platform: "browser",
    jsx: "automatic",
    outfile: "dist/ui/index.js",
    external: ["react", "react/jsx-runtime", "react-dom", "@paperclipai/plugin-sdk/ui"],
  }),
]);
console.log("Built Paperclip Chinese localization plugin.");
