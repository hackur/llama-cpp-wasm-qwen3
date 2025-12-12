/**
 * Chrome Extension Service Worker (Manifest V3)
 * Message broker between popup UI and offscreen document
 */

const MODEL_FILE_PATH = 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf';
const OFFSCREEN_DOCUMENT_PATH = 'html/offscreen.html';

let creatingOffscreenPromise = null;
let popupSendResponse = null;

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action } = request;

  if (action === 'PING') {
    sendResponse({ message: 'PONG' });
    return false;
  }

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

    return true;
  }

  if (action === 'SEND_PROMPT') {
    (async () => {
      if (!await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) {
        sendResponse({ success: false, message: 'Model not loaded' });
        return;
      }

      popupSendResponse = sendResponse;
      chrome.runtime.sendMessage({
        action: 'OFFSCREEN_RUN_PROMPT',
        prompt: request.prompt
      }).catch(() => {});
    })();

    return true;
  }

  // Offscreen responses
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

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      modelStatus: 'not_loaded',
      modelStatusMessage: 'Click Load Model to start.'
    });
  }
});
