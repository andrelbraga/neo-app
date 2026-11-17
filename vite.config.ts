import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: { host: true, port: 5174, strictPort: true },
  preview: { port: 5174 },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  esbuild: { drop: mode === "production" ? ["console", "debugger"] : [] },
  build: { target: "esnext", sourcemap: false },
}));
