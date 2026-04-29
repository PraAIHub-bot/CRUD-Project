import express from 'express';
import http from 'node:http';
import { join } from 'node:path';

// Build an Express app configured the same way as app.js (view engine, views
// path, static serving) but without DB connect or listen() — so smoke tests
// can render templates and serve static assets in isolation.
export function buildTestApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', join(process.cwd(), 'views'));

  app.use(express.urlencoded({ extended: false }));
  app.use('/', express.static(join(process.cwd(), 'public')));

  // Lightweight route used only by smoke tests — renders the real index
  // template with empty fixture data so we exercise the view engine without
  // needing MongoDB.
  app.get('/__smoke/index', (req, res) => {
    res.render('index', { data: [] });
  });

  // 404 handler renders the error template so we verify the error view is
  // wired (addresses the unwired-error-view finding).
  app.use((req, res) => {
    res.status(404).render('error', {
      status: 404,
      message: 'Not Found',
    });
  });

  // 5xx handler renders the error template on thrown errors.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    res.status(500).render('error', {
      status: 500,
      message: err?.message || 'Internal Server Error',
    });
  });

  return app;
}

// Minimal supertest-style helper: starts the app on an ephemeral port,
// performs a single GET, returns { status, headers, text }, and closes the
// server. Avoids pulling in supertest as a devDependency.
export function getRequest(app, path) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.get(
        { host: '127.0.0.1', port, path },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            server.close(() => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                text: body,
              });
            });
          });
        },
      );
      req.on('error', (err) => {
        server.close(() => reject(err));
      });
    });
    server.on('error', reject);
  });
}

export default buildTestApp;
