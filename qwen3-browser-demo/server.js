/**
 * @fileoverview Development Server with COOP/COEP Headers
 *
 * A minimal HTTP server that serves static files with the security headers
 * required for SharedArrayBuffer support. These headers are necessary for
 * multi-threaded WebAssembly execution in the browser.
 *
 * Security Headers:
 * - Cross-Origin-Opener-Policy: same-origin
 *   Isolates the browsing context from cross-origin windows
 *
 * - Cross-Origin-Embedder-Policy: require-corp
 *   Prevents loading cross-origin resources without explicit permission
 *
 * These headers enable SharedArrayBuffer, which is required for:
 * - Multi-threaded WASM execution via Web Workers
 * - Shared memory between main thread and workers
 * - Significantly improved inference performance
 *
 * Usage:
 *   node server.js
 *
 * References:
 * - COOP/COEP: https://web.dev/cross-origin-isolation-guide/
 * - SharedArrayBuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
 *
 * @license MIT
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Server configuration.
 * @const {number} PORT - TCP port to listen on
 * @const {string} DIR - Base directory for serving files
 */
const PORT = 8080;
const DIR = __dirname;

/**
 * MIME type mapping for common file extensions.
 * Used to set the Content-Type header for served files.
 * @const {Object.<string, string>}
 */
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.gguf': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

/**
 * HTTP request handler.
 *
 * Sets required COOP/COEP headers on all responses and serves static files
 * with support for HTTP range requests (required for large model files).
 *
 * @param {http.IncomingMessage} req - The HTTP request
 * @param {http.ServerResponse} res - The HTTP response
 */
const server = http.createServer((req, res) => {
  /*
   * Set Cross-Origin Isolation headers.
   * These are required for SharedArrayBuffer to be available.
   */
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Access-Control-Allow-Origin', '*');

  /* Resolve file path, defaulting to index.html for root */
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const fileSize = stats.size;
    const range = req.headers.range;

    /*
     * Support HTTP Range requests for large files.
     * This allows browsers to resume interrupted downloads of the model file.
     */
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });

      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('COOP/COEP headers enabled for SharedArrayBuffer support');
});
