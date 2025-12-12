/**
 * @file main-worker.js
 * @description Web Worker for llama.cpp WASM inference
 *
 * Runs in a dedicated thread to prevent blocking the UI during model
 * loading and inference. Communicates with the main thread via postMessage.
 *
 * @author llama-cpp-wasm-qwen3
 * @license MIT
 */

import { action } from './actions.js';
import { loadBinaryResource } from './utility.js';
import Module from './main.js';

/**
 * The initialized Emscripten module instance.
 * @type {Object|undefined}
 */
let module;

/**
 * Virtual filesystem path where the model is stored.
 * @const {string}
 */
const MODEL_PATH = '/models/model.bin';

/**
 * Sends a token chunk back to the main thread.
 *
 * @param {string} text - Generated text chunk
 * @fires postMessage
 */
function sendToken(text) {
  postMessage({ event: action.WRITE_RESULT, text });
}

/**
 * UTF-8 decoder for converting output bytes to string.
 * @const {TextDecoder}
 */
const decoder = new TextDecoder('utf-8');

/**
 * ASCII codes for punctuation characters.
 * Used to determine when to flush the output buffer.
 * @const {number[]}
 */
const PUNCTUATION = [
  33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  58, 59, 60, 61, 62, 63, 64, 91, 92, 93, 94, 95, 96, 123, 124, 125, 126
];

/**
 * ASCII codes for whitespace characters.
 * @const {number[]}
 */
const WHITESPACE = [32, 9, 10, 13, 11, 12];

/**
 * Combined set of characters that trigger buffer flush.
 * Flushing on word boundaries gives smoother streaming output.
 * @const {number[]}
 */
const FLUSH_CHARS = [...PUNCTUATION, ...WHITESPACE];

/**
 * Buffer for accumulating stdout bytes before flushing.
 * @type {number[]}
 */
const stdoutBuffer = [];

/**
 * TTY stdin handler (unused but required by Emscripten).
 * @returns {undefined}
 */
const stdin = () => {};

/**
 * TTY stdout handler - accumulates bytes and flushes on word boundaries.
 *
 * @param {number} c - Single byte character code
 */
const stdout = (c) => {
  stdoutBuffer.push(c);

  // Only flush on punctuation/whitespace for word-by-word streaming
  if (FLUSH_CHARS.indexOf(c) === -1) return;

  const text = decoder.decode(new Uint8Array(stdoutBuffer));
  stdoutBuffer.length = 0;
  sendToken(text);
};

/**
 * TTY stderr handler (unused but required by Emscripten).
 * @returns {undefined}
 */
const stderr = () => {};

/**
 * Initializes the WASM module and loads the model into virtual filesystem.
 *
 * @async
 * @param {string} modelUrl - URL to fetch the GGUF model from
 * @fires postMessage - Sends INITIALIZED when ready
 */
async function initWorker(modelUrl) {
  const emscrModule = {
    noInitialRun: true,
    preInit: [() => {
      // Register stdout TTY device
      emscrModule.TTY.register(emscrModule.FS.makedev(5, 0), {
        get_char: (tty) => stdin(tty),
        put_char: (tty, val) => { tty.output.push(val); stdout(val); },
        flush: (tty) => { tty.output = []; },
        fsync: () => {}
      });

      // Register stderr TTY device
      emscrModule.TTY.register(emscrModule.FS.makedev(6, 0), {
        get_char: (tty) => stdin(tty),
        put_char: (tty, val) => { tty.output.push(val); stderr(val); },
        flush: (tty) => { tty.output = []; },
        fsync: () => {}
      });
    }],
  };

  module = await Module(emscrModule);

  // Load model file and store in virtual filesystem
  loadBinaryResource(modelUrl, (bytes) => {
    module['FS_createPath']('/', 'models', true, true);
    module['FS_createDataFile']('/models', 'model.bin', bytes, true, true, true);
    postMessage({ event: action.INITIALIZED });
  });
}

/**
 * Runs inference with the provided parameters.
 *
 * Builds command-line arguments for llama.cpp's main() function
 * and invokes it via Emscripten's callMain.
 *
 * @param {string} prompt - Input prompt text
 * @param {boolean} chatml - Whether to use ChatML format
 * @param {number} n_predict - Max tokens to generate
 * @param {number} ctx_size - Context window size
 * @param {number} batch_size - Batch size (unused in WASM)
 * @param {number} temp - Sampling temperature
 * @param {number} n_gpu_layers - GPU layers (unused in WASM)
 * @param {number} top_k - Top-K sampling value
 * @param {number} top_p - Top-P (nucleus) sampling value
 * @param {boolean} no_display_prompt - Hide prompt from output
 * @fires postMessage - Sends RUN_COMPLETED when done
 */
function runInference(prompt, chatml, n_predict, ctx_size, batch_size, temp, n_gpu_layers, top_k, top_p, no_display_prompt) {
  const args = [
    '--model', MODEL_PATH,
    '--n-predict', n_predict.toString(),
    '--ctx-size', ctx_size.toString(),
    '--temp', temp.toString(),
    '--top-k', top_k.toString(),
    '--top-p', top_p.toString(),
    '--simple-io',
    '--log-disable',
    '--prompt', prompt.toString(),
  ];

  // Use all available CPU cores if threading is supported
  if (globalThis.SharedArrayBuffer) {
    args.push('--threads', navigator.hardwareConcurrency.toString());
  }

  if (chatml) args.push('--chatml');
  if (no_display_prompt) args.push('--no-display-prompt');

  module['callMain'](args);

  postMessage({ event: action.RUN_COMPLETED });
}

/**
 * Message handler for commands from the main thread.
 *
 * @listens message
 * @param {MessageEvent} e - Message event from main thread
 */
self.addEventListener('message', (e) => {
  const { event, ...data } = e.data;

  switch (event) {
    case action.LOAD:
      initWorker(data.url);
      break;

    case action.RUN_MAIN:
      runInference(
        data.prompt,
        data.chatml,
        data.n_predict,
        data.ctx_size,
        data.batch_size,
        data.temp,
        data.n_gpu_layers,
        data.top_k,
        data.top_p,
        data.no_display_prompt
      );
      break;
  }
});
