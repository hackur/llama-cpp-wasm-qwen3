/**
 * @file llama.js
 * @description LlamaCpp wrapper class for browser-based inference
 *
 * Provides a high-level interface for loading and running llama.cpp models
 * in the browser. Internally manages a Web Worker to keep inference off
 * the main thread.
 *
 * @author llama-cpp-wasm-qwen3
 * @license MIT
 *
 * @example
 * const llm = new LlamaCpp(
 *   '/models/qwen3.gguf',
 *   () => console.log('Model ready'),
 *   (token) => process.stdout.write(token),
 *   () => console.log('Done')
 * );
 *
 * llm.run({ prompt: 'Hello, world!', temp: 0.7 });
 */

import { action } from './actions.js';

/**
 * @typedef {Object} RunOptions
 * @property {string} prompt - Input text for the model
 * @property {boolean} [chatml=false] - Use ChatML template format
 * @property {number} [n_predict=-2] - Max tokens to generate (-1 = unlimited, -2 = use context)
 * @property {number} [ctx_size=2048] - Context window size in tokens
 * @property {number} [batch_size=512] - Batch size for prompt processing
 * @property {number} [temp=0.8] - Sampling temperature (0 = greedy, higher = more random)
 * @property {number} [n_gpu_layers=0] - GPU layers (not used in WASM builds)
 * @property {number} [top_k=40] - Top-K sampling cutoff
 * @property {number} [top_p=0.9] - Nucleus sampling probability threshold
 * @property {boolean} [no_display_prompt=true] - Exclude prompt from output
 */

/**
 * High-level wrapper for llama.cpp WebAssembly inference.
 *
 * Creates a Web Worker that loads the WASM module and handles inference.
 * All heavy computation happens off the main thread.
 *
 * @class
 */
class LlamaCpp {
  /**
   * Creates a new LlamaCpp instance and begins loading the model.
   *
   * @constructor
   * @param {string} url - URL or path to the GGUF model file
   * @param {Function} init_callback - Called when model is loaded and ready
   * @param {Function} write_result_callback - Called for each generated token chunk
   * @param {Function} on_complete_callback - Called when generation finishes
   * @param {Function} [error_callback=null] - Called on errors (optional)
   */
  constructor(url, init_callback, write_result_callback, on_complete_callback, error_callback = null) {
    /** @type {string} */
    this.url = url;

    /** @type {Function} */
    this.init_callback = init_callback;

    /** @type {Function} */
    this.write_result_callback = write_result_callback;

    /** @type {Function} */
    this.on_complete_callback = on_complete_callback;

    /** @type {Function|null} */
    this.error_callback = error_callback;

    /** @type {Worker|null} */
    this.worker = null;

    this.loadWorker();
  }

  /**
   * Initializes the Web Worker and sets up message handlers.
   *
   * @private
   * @fires Worker#message
   */
  loadWorker() {
    this.worker = new Worker(
      new URL('./main-worker.js', import.meta.url),
      { type: 'module' }
    );

    /**
     * Handle messages from the worker.
     * @param {MessageEvent} event - Worker message event
     */
    this.worker.onmessage = (event) => {
      switch (event.data.event) {
        case action.INITIALIZED:
          if (this.init_callback) this.init_callback();
          break;

        case action.WRITE_RESULT:
          if (this.write_result_callback) {
            this.write_result_callback(event.data.text);
          }
          break;

        case action.RUN_COMPLETED:
          if (this.on_complete_callback) this.on_complete_callback();
          break;

        case action.ERROR:
          console.error('Worker error:', event.data.error);
          if (this.error_callback) this.error_callback(event.data.error);
          break;

        default:
          console.warn('Unknown worker event:', event.data.event);
      }
    };

    /**
     * Handle worker-level errors (script loading, etc).
     * @param {ErrorEvent} error - Error event
     */
    this.worker.onerror = (error) => {
      console.error('Worker error:', error.message);
      if (this.error_callback) this.error_callback(error.message);
    };

    // Tell worker to load the model
    this.worker.postMessage({
      event: action.LOAD,
      url: this.url,
    });
  }

  /**
   * Runs inference with the given prompt and options.
   *
   * @param {RunOptions} options - Generation parameters
   * @fires Worker#message
   *
   * @example
   * llm.run({
   *   prompt: 'Write a haiku about coding:',
   *   n_predict: 50,
   *   temp: 0.7,
   *   top_p: 0.95
   * });
   */
  run({
    prompt,
    chatml = false,
    n_predict = -2,
    ctx_size = 2048,
    batch_size = 512,
    temp = 0.8,
    n_gpu_layers = 0,
    top_k = 40,
    top_p = 0.9,
    no_display_prompt = true,
  } = {}) {
    this.worker.postMessage({
      event: action.RUN_MAIN,
      prompt,
      chatml,
      n_predict,
      ctx_size,
      batch_size,
      temp,
      n_gpu_layers,
      top_k,
      top_p,
      no_display_prompt,
    });
  }
}

export { LlamaCpp };
