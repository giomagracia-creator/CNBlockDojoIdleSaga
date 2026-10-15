import { defineConfig, type ViteDevServer } from "vite";

function senseiRoute() {
  const rewrite = (req: { url?: string }) => {
    if (req.url === "/sensei" || req.url === "/sensei/") req.url = "/sensei.html";
  };
  return {
    name: "sensei-route",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server: ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 4721,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4721,
    strictPort: true,
  },
  plugins: [senseiRoute()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        sensei: "sensei.html",
      },
    },
  },
});
