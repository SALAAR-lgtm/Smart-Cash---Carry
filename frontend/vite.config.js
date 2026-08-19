import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? environment.VITE_API_PROXY_TARGET;

  if (!apiProxyTarget) {
    throw new Error("VITE_API_PROXY_TARGET must be provided in the environment.");
  }

  return {
    plugins: [react()],
    server: {
      proxy: ["/api", "/uploads"].reduce((proxy, path) => {
        proxy[path] = { target: apiProxyTarget, changeOrigin: true };
        return proxy;
      }, {}),
    },
  };
});
