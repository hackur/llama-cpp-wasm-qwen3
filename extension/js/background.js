/**
 * @fileoverview Chrome Extension Service Worker (Manifest V3)
 *
 * This service worker acts as the central message broker between the popup UI
 * and the offscreen document that hosts the wllama WASM worker. It manages
 * the offscreen document lifecycle and persists model state to chrome.storage.
 *
 * Architecture:
 * - Popup UI sends LOAD_MODEL and SEND_PROMPT messages here
 * - This script creates/manages the offscreen document
 * - Model operations are delegated to the offscreen document
 * - Results flow back through this script to the popup
 *
 * Message Flow:
 * Popup -> Background -> Offscreen -> Background -> Popup
 *
 * References:
 * - Chrome Service Workers: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers
 * - Chrome Offscreen API: https://developer.chrome.com/docs/extensions/reference/api/offscreen
 *
 * @license MIT
 */

/**
 * Relative path to the GGUF model file within the extension package.
 * @const {string}
 */
const MODEL_FILE_PATH = 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf';

/**
 * Relative path to the offscreen HTML document.
 * @const {string}
 */
const OFFSCREEN_DOCUMENT_PATH = 'html/offscreen.html';

/**
 * Promise tracking offscreen document creation.
 * Used to prevent race conditions when multiple requests arrive simultaneously.
 * @type {Promise<void>|null}
 */
let creatingOffscreenPromise = null;

/**
 * Cached sendResponse callback from the popup.
 * Stored to enable asynchronous response delivery after model operations complete.
 * @type {Function|null}
 */
let popupSendResponse = null;

/**
 * Updates the popup UI and persists status to storage.
 *
 * Attempts direct callback first for immediate delivery when popup is open,
 * then falls back to broadcast via runtime.sendMessage.
 *
 * @param {string} status - Model status: 'not_loaded' | 'loading' | 'loaded' | 'error'
 * @param {string} [message=''] - Human-readable status description
 */
function updatePopupStatus(status, message = '') {
  const payload = { action: 'UPDATE_MODEL_STATUS', status, message };

  /*
   * Try direct callback first (faster when popup is open).
   * Fall back to broadcast if callback is stale.
   */
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

  /* Persist state for popup restoration after close/reopen */
  chrome.storage.local.set({ modelStatus: status, modelStatusMessage: message });
}

/**
 * Checks whether an offscreen document exists at the specified path.
 *
 * Uses the chrome.runtime.getContexts API introduced in Chrome 116.
 * Returns false on older Chrome versions that lack this API.
 *
 * @async
 * @param {string} path - Relative path to the offscreen document
 * @returns {Promise<boolean>} True if the document exists and is active
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
 * Creates the offscreen document for hosting the WASM worker.
 *
 * Implements singleton pattern: returns early if document exists or
 * creation is already in progress. This prevents duplicate documents
 * which would cause resource conflicts.
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If offscreen document creation fails
 */
async function setupOffscreenDocument() {
  if (await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) return;
  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }

  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification: 'Running wllama WASM worker for local inference'
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
 * Routes messages between popup UI and offscreen document:
 *
 * From Popup:
 * - PING: Health check, returns PONG
 * - LOAD_MODEL: Triggers model initialization
 * - SEND_PROMPT: Sends prompt for completion
 *
 * From Offscreen:
 * - OFFSCREEN_MODEL_LOADED: Model ready notification
 * - OFFSCREEN_PROGRESS: Download progress update
 * - OFFSCREEN_MODEL_RESPONSE: Generated text response
 * - OFFSCREEN_MODEL_INIT_ERROR: Initialization failure
 * - OFFSCREEN_MODEL_RUN_ERROR: Inference failure
 * - OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT: Model not ready
 * - OFFSCREEN_ALREADY_INITIALIZING: Duplicate init request
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} request - Message payload with action property
 * @param {chrome.runtime.MessageSender} sender - Message sender information
 * @param {Function} sendResponse - Callback for synchronous or async response
 * @returns {boolean} True if response will be sent asynchronously
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action } = request;

  /* Health check endpoint */
  if (action === 'PING') {
    sendResponse({ message: 'PONG' });
    return false;
  }

  /* Model loading request from popup */
  if (action === 'LOAD_MODEL') {
    updatePopupStatus('loading', 'Initializing...');

    (async () => {
      try {
        await setupOffscreenDocument();
        chrome.runtime.sendMessage({
          action: 'OFFSCREEN_INIT_MODEL',
          modelUrl: chrome.runtime.getURL(MODEL_FILE_PATH)
        }).catch(() => {});
        sendResponse({ success: true });
      } catch (error) {
        updatePopupStatus('error', error.message);
        sendResponse({ success: false, message: error.message });
      }
    })();

    return true; /* Async response */
  }

  /* Prompt submission from popup */
  if (action === 'SEND_PROMPT') {
    (async () => {
      if (!await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) {
        sendResponse({ success: false, message: 'Model not loaded' });
        return;
      }

      /* Store callback for async response delivery */
      popupSendResponse = sendResponse;
      chrome.runtime.sendMessage({
        action: 'OFFSCREEN_RUN_PROMPT',
        prompt: request.prompt
      }).catch(() => {});
    })();

    return true; /* Async response */
  }

  /* --- Responses from offscreen document --- */

  if (action === 'OFFSCREEN_MODEL_LOADED') {
    updatePopupStatus('loaded', 'Model ready!');
    return false;
  }

  if (action === 'OFFSCREEN_PROGRESS') {
    updatePopupStatus('loading', `Loading... ${request.percent}%`);
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
    updatePopupStatus('error', request.error);
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
        popupSendResponse({ success: false, message: 'Model not loaded' });
      } catch (e) {}
      popupSendResponse = null;
    }
    return false;
  }

  if (action === 'OFFSCREEN_ALREADY_INITIALIZING') {
    updatePopupStatus('loading', 'Loading in progress...');
    return false;
  }

  return false;
});

/**
 * Extension installation handler.
 *
 * Initializes storage with default values on fresh install.
 * On update, preserves existing state but ensures model path is current.
 *
 * @listens chrome.runtime.onInstalled
 * @param {Object} details - Installation event details
 * @param {string} details.reason - 'install' | 'update' | 'chrome_update'
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      modelStatus: 'not_loaded',
      modelStatusMessage: 'Click Load Model to start.'
    });
  }
});
