import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // UI primitives (Radix)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-accordion",
            "@radix-ui/react-avatar",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
          ],
          // Heavy charts library — only loaded when admin analytics page is visited
          "vendor-recharts": ["recharts"],
          // Form handling
          "vendor-forms": ["react-hook-form", "zod", "@hookform/resolvers"],
          // TanStack Query
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
    // Raise warning limit slightly since we've already split into chunks
    chunkSizeWarningLimit: 600,
  },
}));
