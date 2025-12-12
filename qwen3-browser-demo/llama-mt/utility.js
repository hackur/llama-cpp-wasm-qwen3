/**
 * @file utility.js
 * @description Utility functions for model loading
 *
 * Provides caching and fetching utilities for loading large binary
 * resources (GGUF model files) in Web Worker context.
 *
 * @author llama-cpp-wasm-qwen3
 * @license MIT
 */

/**
 * Cache name for storing downloaded model files.
 * @const {string}
 */
const cacheName = 'llama-cpp-wasm-cache';

/**
 * Loads a binary resource from URL with Cache API support.
 *
 * First checks the browser's Cache API for a previously downloaded copy.
 * If not found, downloads via XHR and stores in cache for future use.
 * This is particularly useful for large model files (~500MB+).
 *
 * @async
 * @param {string} url - URL to the binary resource
 * @param {Function} callback - Called with Uint8Array of loaded bytes
 *
 * @example
 * loadBinaryResource('/models/qwen3.gguf', (bytes) => {
 *   console.log(`Loaded ${bytes.length} bytes`);
 *   // Store in Emscripten filesystem
 * });
 */
export async function loadBinaryResource(url, callback) {
  /** @type {Cache|null} */
  let cache = null;

  // Reference to global scope (works in both Window and Worker contexts)
  const window = self;

  // Try to load from cache first
  if (typeof window === 'undefined') {
    console.debug('`window` is not defined');
  } else if (window && window.caches) {
    cache = await window.caches.open(cacheName);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      const data = await cachedResponse.arrayBuffer();
      const byteArray = new Uint8Array(data);
      callback(byteArray);
      return;
    }
  }

  // Not in cache - download and store
  const req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';

  req.onload = async () => {
    const arrayBuffer = req.response;

    if (arrayBuffer) {
      const byteArray = new Uint8Array(arrayBuffer);

      // Cache for future use
      if (cache) {
        await cache.put(url, new Response(arrayBuffer));
      }

      callback(byteArray);
    }
  };

  req.send(null);
}
