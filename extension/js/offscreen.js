/**
 * @file offscreen.js
 * @description Offscreen document for hosting LlamaCpp WASM worker
 *
 * Chrome MV3 requires offscreen documents to run persistent workers.
 * This script initializes and manages the LlamaCpp instance, handling
 * messages from the background service worker.
 *
 * @author llama-cpp-wasm-qwen3
 * @license MIT
 */

import { LlamaCpp } from './lib/llama.js';

console.log('[Offscreen] Script loaded');

/**
 * Active LlamaCpp instance.
 * @type {LlamaCpp|null}
 */
let llamaCppInstance = null;

/**
 * Accumulated response text from current inference.
 * @type {string}
 */
let currentModelResponse = '';

/**
 * Flag to prevent duplicate initialization requests.
 * @type {boolean}
 */
let isInitializing = false;

/**
 * Whether model has been successfully loaded.
 * @type {boolean}
 */
let modelSuccessfullyLoaded = false;

/**
 * Sends a message to the background service worker.
 *
 * @param {Object} message - Message payload with action property
 * @param {string} message.action - Action identifier
 */
function sendMessageToBackground(message) {
  chrome.runtime.sendMessage(message).catch(e => {
    console.error('[Offscreen] Error sending message:', e.message, message);
  });
}

/**
 * Callback fired when model initialization completes.
 * @fires chrome.runtime.sendMessage - OFFSCREEN_MODEL_LOADED
 */
const init_callback = () => {
  console.log('[Offscreen] Model initialized');
  isInitializing = false;
  modelSuccessfullyLoaded = true;
  sendMessageToBackground({ action: 'OFFSCREEN_MODEL_LOADED' });
};

/**
 * Callback fired for each generated token chunk.
 *
 * @param {string} text_chunk - Generated text fragment
 */
const write_result_callback = (text_chunk) => {
  currentModelResponse += text_chunk;
};

/**
 * Callback fired when inference completes.
 * @fires chrome.runtime.sendMessage - OFFSCREEN_MODEL_RESPONSE
 */
const on_complete_callback = () => {
  console.log('[Offscreen] Inference complete, response length:', currentModelResponse.length);
  sendMessageToBackground({
    action: 'OFFSCREEN_MODEL_RESPONSE',
    response: currentModelResponse
  });
  currentModelResponse = '';
};

/**
 * Initializes the LlamaCpp model.
 *
 * Prevents duplicate initialization and handles errors gracefully.
 *
 * @async
 * @param {string} modelUrl - chrome-extension:// URL to the GGUF model
 * @fires chrome.runtime.sendMessage - OFFSCREEN_ALREADY_INITIALIZING, OFFSCREEN_MODEL_LOADED, OFFSCREEN_MODEL_INIT_ERROR
 */
async function initializeLlama(modelUrl) {
  if (isInitializing) {
    console.log('[Offscreen] Already initializing');
    sendMessageToBackground({ action: 'OFFSCREEN_ALREADY_INITIALIZING' });
    return;
  }

  if (modelSuccessfullyLoaded) {
    console.log('[Offscreen] Model already loaded');
    sendMessageToBackground({ action: 'OFFSCREEN_MODEL_LOADED' });
    return;
  }

  isInitializing = true;
  modelSuccessfullyLoaded = false;
  console.log('[Offscreen] Loading model from:', modelUrl);

  try {
    llamaCppInstance = new LlamaCpp(
      modelUrl,
      init_callback,
      write_result_callback,
      on_complete_callback
    );
    console.log('[Offscreen] LlamaCpp instantiated');
  } catch (error) {
    console.error('[Offscreen] Init error:', error);
    isInitializing = false;
    modelSuccessfullyLoaded = false;
    sendMessageToBackground({
      action: 'OFFSCREEN_MODEL_INIT_ERROR',
      error: error.message
    });
  }
}

/**
 * Runs inference with the provided prompt.
 *
 * @param {string} prompt - User input text
 * @fires chrome.runtime.sendMessage - OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT, OFFSCREEN_MODEL_RUN_ERROR
 */
function runLlama(prompt) {
  console.log('[Offscreen] Running prompt:', prompt.substring(0, 50) + '...');

  if (!modelSuccessfullyLoaded || !llamaCppInstance) {
    console.error('[Offscreen] Model not ready');
    sendMessageToBackground({ action: 'OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT' });
    return;
  }

  if (isInitializing) {
    console.error('[Offscreen] Still initializing');
    sendMessageToBackground({
      action: 'OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT',
      error: 'Model still initializing.'
    });
    return;
  }

  currentModelResponse = '';

  try {
    if (llamaCppInstance && typeof llamaCppInstance.run === 'function') {
      llamaCppInstance.run({ prompt: prompt });
    } else {
      console.error('[Offscreen] run() not available');
      sendMessageToBackground({
        action: 'OFFSCREEN_MODEL_RUN_ERROR',
        error: 'llamaCppInstance.run not available.'
      });
    }
  } catch (error) {
    console.error('[Offscreen] Run error:', error);
    sendMessageToBackground({
      action: 'OFFSCREEN_MODEL_RUN_ERROR',
      error: error.message
    });
  }
}

/**
 * Message handler for commands from the background script.
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} request - Message payload
 * @param {string} request.action - Action to perform
 * @param {string} [request.modelUrl] - Model URL for OFFSCREEN_INIT_MODEL
 * @param {string} [request.prompt] - Prompt for OFFSCREEN_RUN_PROMPT
 * @param {chrome.runtime.MessageSender} sender - Message sender
 * @param {Function} sendResponse - Callback for synchronous response
 * @returns {boolean} False to indicate synchronous handling
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Offscreen] Received:', request.action);

  switch (request.action) {
    case 'OFFSCREEN_INIT_MODEL':
      if (request.modelUrl) {
        initializeLlama(request.modelUrl);
        sendResponse({ success: true, message: 'Init started' });
      } else {
        console.error('[Offscreen] Missing modelUrl');
        sendResponse({ success: false, message: 'modelUrl missing' });
      }
      break;

    case 'OFFSCREEN_RUN_PROMPT':
      if (request.prompt) {
        runLlama(request.prompt);
      } else {
        console.error('[Offscreen] Missing prompt');
      }
      break;

    default:
      console.warn('[Offscreen] Unknown action:', request.action);
      break;
  }

  return false;
});

console.log('[Offscreen] Event listeners attached');
