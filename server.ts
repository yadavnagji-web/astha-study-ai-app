import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './server/apiApp.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Astha Study AI Server listening on port ${PORT} [Mode: ${isProduction ? 'prod' : 'dev'}]`);
  });
}

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\.ts$/, '') === path.resolve(process.argv[1]).replace(/\.ts$/, '');

if (isDirectRun && !process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal Server error:', err);
  });
}

export default app;
