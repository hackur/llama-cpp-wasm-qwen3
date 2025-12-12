/**
 * @file background.js
 * @description Chrome Extension Service Worker (Manifest V3)
 *
 * Acts as the central message broker between the popup UI and the offscreen
 * document that hosts the llama.cpp WASM worker. Manages the offscreen document
 * lifecycle and persists model state to chrome.storage.
 *
 * @author llama-cpp-wasm-qwen3
 * @license MIT
 */

/**
 * @typedef {Object} ModelStatus
 * @property {'not_loaded'|'loading'|'loaded'|'error'} status - Current model state
 * @property {string} [message] - Human-readable status message
 */

/**
 * @typedef {Object} OffscreenMessage
 * @property {string} action - Action identifier
 * @property {string} [modelUrl] - URL to GGUF model file
 * @property {string} [prompt] - User prompt for inference
 * @property {string} [response] - Model response text
 * @property {string} [error] - Error message
 */

/** @const {string} Path to the GGUF model file within the extension */
const MODEL_FILE_PATH = 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf';

/** @const {string} Path to the offscreen HTML document */
const OFFSCREEN_DOCUMENT_PATH = 'html/offscreen.html';

/**
 * Promise tracking offscreen document creation.
 * Prevents race conditions when multiple load requests arrive simultaneously.
 * @type {Promise<void>|null}
 */
let creatingOffscreenPromise = null;

/**
 * Cached sendResponse callback from the popup.
 * Used to send async model responses back to the popup UI.
 * @type {Function|null}
 */
let popupSendResponse = null;

/**
 * Broadcasts status updates to the popup and persists to storage.
 *
 * Attempts direct callback first (faster when popup is open),
 * falls back to runtime.sendMessage for broadcast delivery.
 *
 * @param {string} status - Model status: 'not_loaded' | 'loading' | 'loaded' | 'error'
 * @param {string} [message=''] - Optional descriptive message
 * @fires chrome.runtime.sendMessage
 */
function updatePopupStatus(status, message = '') {
  const payload = { action: 'UPDATE_MODEL_STATUS', status, message };

  if (popupSendResponse) {
    try {
      popupSendResponse(payload);
    } catch (e) {
      popupSendResponse = null;
      chrome.runtime.sendMessage(payload).catch(() => {});
    }
  } else {
    chrome.runtime.sendMessage(payload).catch(() => {});
  }

  chrome.storage.local.set({ modelStatus: status, modelStatusMessage: message });
}

/**
 * Checks if an offscreen document exists at the specified path.
 *
 * Uses the MV3 getContexts API when available (Chrome 116+).
 * Returns false on older versions that lack this API.
 *
 * @param {string} path - Relative path to the offscreen document
 * @returns {Promise<boolean>} True if document exists
 */
async function hasOffscreenDocument(path) {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(path)]
    });
    return contexts && contexts.length > 0;
  }
  return false;
}

/**
 * Creates the offscreen document that hosts the WASM worker.
 *
 * Implements a singleton pattern - if document exists or is being created,
 * returns early to prevent duplicate documents.
 *
 * @returns {Promise<void>}
 * @throws {Error} If offscreen document creation fails
 */
async function setupOffscreenDocument() {
  if (await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) {
    return;
  }

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }

  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification: 'Running llama.cpp WASM worker for local inference'
  });

  try {
    await creatingOffscreenPromise;
  } finally {
    creatingOffscreenPromise = null;
  }
}

/**
 * Main message router for the extension.
 *
 * Handles messages from:
 * - Popup UI: PING, LOAD_MODEL, SEND_PROMPT, CHECK_OFFSCREEN_STATUS
 * - Offscreen document: OFFSCREEN_MODEL_LOADED, OFFSCREEN_MODEL_RESPONSE, etc.
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} request - Message payload
 * @param {string} request.action - Action identifier
 * @param {chrome.runtime.MessageSender} sender - Message sender info
 * @param {Function} sendResponse - Callback for synchronous responses
 * @returns {boolean} True if response will be sent asynchronously
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action } = request;

  // Health check
  if (action === 'PING') {
    sendResponse({ message: 'PONG from background script' });
    return false;
  }

  // Load model request from popup
  if (action === 'LOAD_MODEL') {
    updatePopupStatus('loading', 'Initializing model...');

    (async () => {
      try {
        await setupOffscreenDocument();
        const modelUrl = chrome.runtime.getURL(MODEL_FILE_PATH);

        chrome.runtime.sendMessage({
          action: 'OFFSCREEN_INIT_MODEL',
          modelUrl: modelUrl
        }).catch(() => {});

        sendResponse({ success: true, message: 'Model loading started' });
      } catch (error) {
        updatePopupStatus('error', `Failed: ${error.message}`);
        sendResponse({ success: false, message: error.message });
      }
    })();

    return true;
  }

  // Prompt request from popup
  if (action === 'SEND_PROMPT') {
    (async () => {
      try {
        if (!await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) {
          sendResponse({ success: false, message: 'Model not loaded. Please load model first.' });
          return;
        }

        popupSendResponse = sendResponse;

        chrome.runtime.sendMessage({
          action: 'OFFSCREEN_RUN_PROMPT',
          prompt: request.prompt
        }).catch(() => {});

      } catch (error) {
        sendResponse({ success: false, message: error.message });
      }
    })();

    return true;
  }

  // --- Offscreen document responses ---

  if (action === 'OFFSCREEN_MODEL_LOADED') {
    updatePopupStatus('loaded', 'Model ready!');
    return false;
  }

  if (action === 'OFFSCREEN_MODEL_RESPONSE') {
    if (popupSendResponse) {
      try {
        popupSendResponse({ success: true, response: request.response });
      } catch (e) {}
      popupSendResponse = null;
    }
    return false;
  }

  if (action === 'OFFSCREEN_MODEL_INIT_ERROR') {
    updatePopupStatus('error', `Init failed: ${request.error}`);
    return false;
  }

  if (action === 'OFFSCREEN_MODEL_RUN_ERROR') {
    if (popupSendResponse) {
      try {
        popupSendResponse({ success: false, message: request.error });
      } catch (e) {}
      popupSendResponse = null;
    }
    return false;
  }

  if (action === 'OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT') {
    if (popupSendResponse) {
      try {
        popupSendResponse({ success: false, message: 'Model not loaded.' });
      } catch (e) {}
      popupSendResponse = null;
    }
    return false;
  }

  if (action === 'OFFSCREEN_ALREADY_INITIALIZING') {
    updatePopupStatus('loading', 'Model loading in progress...');
    return false;
  }

  // Debug endpoint
  if (action === 'CHECK_OFFSCREEN_STATUS') {
    (async () => {
      try {
        const hasDoc = await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
        sendResponse({ success: true, hasOffscreenDocument: hasDoc });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  sendResponse({ success: false, message: `Unknown action: ${action}` });
  return false;
});

/**
 * Initializes storage on extension install or update.
 *
 * @listens chrome.runtime.onInstalled
 * @param {Object} details - Install details
 * @param {string} details.reason - 'install' | 'update' | 'chrome_update'
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      modelStatus: 'not_loaded',
      modelPath: MODEL_FILE_PATH,
      modelStatusMessage: 'Extension installed. Click Load Model to start.'
    });
  } else if (details.reason === 'update') {
    chrome.storage.local.set({ modelPath: MODEL_FILE_PATH });
  }
});
