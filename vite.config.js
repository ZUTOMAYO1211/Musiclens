import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Middleware to rewrite root '/' to '/intro.html'
const rootRedirectPlugin = () => ({
  name: 'root-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (url.pathname === '/') {
        req.url = '/intro.html' + url.search;
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), rootRedirectPlugin()],
  build: {
    rollupOptions: {
      input: {
        intro: 'intro.html'
      }
    }
  }
});
