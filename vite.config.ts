// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function tanstackInjectedHeadScriptsShim(): Plugin {
  const moduleId = "tanstack-start-injected-head-scripts:v";
  const resolvedId = `\0${moduleId}`;

  return {
    name: "tanstack-start-injected-head-scripts-shim",
    enforce: "pre",
    resolveId(id) {
      if (id === moduleId) return resolvedId;
      return undefined;
    },
    load(id) {
      if (id === resolvedId) {
        return 'export const injectedHeadScripts = ""';
      }
      return undefined;
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  plugins: [tanstackInjectedHeadScriptsShim()],
  tanstackStart: {
    server: { entry: "server" },
  },
});
