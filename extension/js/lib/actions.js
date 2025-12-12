/**
 * @file actions.js
 * @description Action constants for worker-main thread communication
 *
 * Defines the message types used between the LlamaCpp wrapper and its
 * Web Worker. Using numeric constants keeps messages compact.
 *
 * @author llama-cpp-wasm-qwen3
 * @license MIT
 */

/**
 * Worker action types for message passing.
 *
 * @readonly
 * @enum {number}
 * @property {number} LOAD - Request to load model from URL
 * @property {number} INITIALIZED - Model loaded and ready
 * @property {number} RUN_MAIN - Start inference with prompt
 * @property {number} WRITE_RESULT - Token chunk generated
 * @property {number} RUN_COMPLETED - Inference finished
 * @property {number} ERROR - Error occurred
 */
export const action = {
  LOAD: 0,
  INITIALIZED: 1,
  RUN_MAIN: 2,
  WRITE_RESULT: 3,
  RUN_COMPLETED: 4,
  ERROR: 5
};
