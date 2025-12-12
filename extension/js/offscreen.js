/**
 * @fileoverview Offscreen Document for wllama WASM Worker
 *
 * Chrome Manifest V3 extensions cannot run persistent background scripts.
 * This offscreen document provides a context for the wllama Web Worker
 * to execute, enabling WASM-based LLM inference within the extension.
 *
 * The offscreen document receives commands from the background service worker
 * and communicates results back via chrome.runtime.sendMessage.
 *
 * Architecture:
 * - Background script creates this offscreen document on demand
 * - This script initializes wllama and loads the GGUF model
 * - Inference requests are forwarded here from the background script
 * - Results are sent back to the background script for relay to the popup
 *
 * References:
 * - Chrome Offscreen Documents: https://developer.chrome.com/docs/extensions/reference/api/offscreen
 * - wllama: https://github.com/ngxson/wllama
 *
 * @license MIT
 */

import { Wllama } from './wllama/index.js';

console.log('[Offscreen] Script loaded');

/**
 * The wllama instance for model operations.
 * Initialized when OFFSCREEN_INIT_MODEL message is received.
 * @type {Wllama|null}
 */
let wllama = null;

/**
 * Flag indicating whether model initialization is in progress.
 * Prevents duplicate initialization requests.
 * @type {boolean}
 */
let isInitializing = false;

/**
 * Flag indicating whether the model has been successfully loaded.
 * @type {boolean}
 */
let modelLoaded = false;

/**
 * Sends a message to the background service worker.
 *
 * @param {Object} message - Message object with action property
 * @param {string} message.action - Action identifier for the background script
 */
function sendToBackground(message) {
  chrome.runtime.sendMessage(message).catch(e => {
    console.error('[Offscreen] Send error:', e.message);
  });
}

/**
 * Initializes the wllama instance and loads the specified model.
 *
 * This function handles the complete model loading process:
 * 1. Creates a new Wllama instance with WASM binary paths
 * 2. Downloads and loads the GGUF model file
 * 3. Reports progress updates to the background script
 * 4. Notifies completion or error status
 *
 * @async
 * @param {string} modelUrl - chrome-extension:// URL to the GGUF model file
 * @fires sendToBackground - OFFSCREEN_ALREADY_INITIALIZING if init in progress
 * @fires sendToBackground - OFFSCREEN_MODEL_LOADED on success
 * @fires sendToBackground - OFFSCREEN_PROGRESS with percent during download
 * @fires sendToBackground - OFFSCREEN_MODEL_INIT_ERROR on failure
 */
async function initializeModel(modelUrl) {
  if (isInitializing) {
    sendToBackground({ action: 'OFFSCREEN_ALREADY_INITIALIZING' });
    return;
  }

  if (modelLoaded) {
    sendToBackground({ action: 'OFFSCREEN_MODEL_LOADED' });
    return;
  }

  isInitializing = true;
  console.log('[Offscreen] Loading model:', modelUrl);

  try {
    /*
     * Configure paths to the WASM binary files.
     * chrome.runtime.getURL resolves extension-relative paths to
     * chrome-extension:// URLs that the worker can fetch.
     */
    const configPaths = {
      'single-thread/wllama.wasm': chrome.runtime.getURL('js/wllama/single-thread/wllama.wasm'),
      'multi-thread/wllama.wasm': chrome.runtime.getURL('js/wllama/multi-thread/wllama.wasm'),
    };

    wllama = new Wllama(configPaths, { allowOffline: true });

    /*
     * Load model with progress callback.
     * The context size (n_ctx) determines the maximum prompt + response length.
     */
    await wllama.loadModelFromUrl(modelUrl, {
      n_ctx: 2048,
      progressCallback: ({ loaded, total }) => {
        const percent = Math.round((loaded / total) * 100);
        sendToBackground({ action: 'OFFSCREEN_PROGRESS', percent });
      },
    });

    modelLoaded = true;
    isInitializing = false;
    console.log('[Offscreen] Model loaded');
    sendToBackground({ action: 'OFFSCREEN_MODEL_LOADED' });
  } catch (error) {
    console.error('[Offscreen] Init error:', error);
    isInitializing = false;
    sendToBackground({ action: 'OFFSCREEN_MODEL_INIT_ERROR', error: error.message });
  }
}

/**
 * Runs inference with the provided prompt.
 *
 * Generates text completion using the loaded model and sends the
 * result back to the background script.
 *
 * @async
 * @param {string} prompt - User input text for completion
 * @fires sendToBackground - OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT if model not ready
 * @fires sendToBackground - OFFSCREEN_MODEL_RESPONSE with generated text
 * @fires sendToBackground - OFFSCREEN_MODEL_RUN_ERROR on failure
 */
async function runPrompt(prompt) {
  if (!modelLoaded || !wllama) {
    sendToBackground({ action: 'OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT' });
    return;
  }

  console.log('[Offscreen] Running prompt');

  try {
    /*
     * Generate completion with sampling parameters.
     *
     * Sampling configuration:
     * - temp: Controls randomness (lower = more deterministic)
     * - top_k: Limits to K most probable tokens
     * - top_p: Nucleus sampling cutoff probability
     */
    const response = await wllama.createCompletion(prompt, {
      nPredict: 256,
      sampling: { temp: 0.7, top_k: 40, top_p: 0.9 },
    });

    sendToBackground({ action: 'OFFSCREEN_MODEL_RESPONSE', response });
  } catch (error) {
    console.error('[Offscreen] Run error:', error);
    sendToBackground({ action: 'OFFSCREEN_MODEL_RUN_ERROR', error: error.message });
  }
}

/**
 * Message listener for commands from the background script.
 *
 * Handles the following actions:
 * - OFFSCREEN_INIT_MODEL: Initialize wllama and load the model
 * - OFFSCREEN_RUN_PROMPT: Generate completion for a prompt
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} request - Message payload
 * @param {string} request.action - Action identifier
 * @param {string} [request.modelUrl] - Model URL for OFFSCREEN_INIT_MODEL
 * @param {string} [request.prompt] - Prompt text for OFFSCREEN_RUN_PROMPT
 * @param {chrome.runtime.MessageSender} sender - Message sender info
 * @param {Function} sendResponse - Callback for immediate response
 * @returns {boolean} False to indicate synchronous response handling
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Offscreen] Received:', request.action);

  if (request.action === 'OFFSCREEN_INIT_MODEL') {
    initializeModel(request.modelUrl);
    sendResponse({ success: true });
  } else if (request.action === 'OFFSCREEN_RUN_PROMPT') {
    runPrompt(request.prompt);
    sendResponse({ success: true });
  }

  return false;
});

console.log('[Offscreen] Ready');
