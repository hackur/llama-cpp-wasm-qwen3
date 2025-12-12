// background.js - Service Worker (Reintroducing hasOffscreenDocument)
console.log('llm-proxy-ext: Background SW started (v5)');

const MODEL_FILE_PATH = 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf';
const OFFSCREEN_DOCUMENT_PATH = 'html/offscreen.html';

let creatingOffscreenPromise = null; // Uncommented
let popupSendResponse = null;

// Function to send status updates to the popup
function updatePopupStatus(status, message = '') {
  console.log(`Background (v5): Updating popup status - ${status}, Msg: ${message}`);
  if (popupSendResponse) {
    try {
      popupSendResponse({ action: 'UPDATE_MODEL_STATUS', status, message });
      console.log('Background (v5): Status sent to stored popupSendResponse.');
    } catch (e) {
      console.warn('Background (v5): Failed to send to stored popupSendResponse, falling back to general sendMessage:', e.message);
      popupSendResponse = null;
      chrome.runtime.sendMessage({ action: 'UPDATE_MODEL_STATUS', status, message })
        .catch(e_fallback => console.warn('Background (v5): General sendMessage also failed:', e_fallback.message));
    }
  } else {
    chrome.runtime.sendMessage({ action: 'UPDATE_MODEL_STATUS', status, message })
      .catch(e_general => console.warn('Background (v5): Failed to send status to popup (general):', e_general.message));
  }
  chrome.storage.local.set({ modelStatus: status, modelStatusMessage: message });
}

async function hasOffscreenDocument(path) {
  console.log(`Background (v5): Checking for offscreen document at path: ${path}`);
  if (chrome.runtime.getContexts) { // Check for Manifest V3 function
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(path)]
    });
    console.log(`Background (v5): Found contexts:`, contexts);
    return !!contexts && contexts.length > 0;
  } else {
    console.warn('Background (v5): chrome.runtime.getContexts not available. Cannot accurately check for offscreen document.');
    // Fallback for older versions or if getContexts is not available (less reliable)
    // This is a less direct way and might not always be accurate.
    // const views = chrome.extension.getViews({ type: 'OFFSCREEN_DOCUMENT' });
    // return views.some(view => view.location.href === chrome.runtime.getURL(path));
    return false; // Prefer to say false if we can't check properly
  }
}

/* // setupOffscreenDocument still commented out
async function setupOffscreenDocument() { ... }
*/

// Listener for messages from popup or offscreen document
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background (v5): Message received:', request, 'From:', sender.url || sender.id);

  if (request.action === 'PING') {
    console.log('Background (v5): Received PING from popup.');
    sendResponse({ message: 'PONG from background script' });
    return false;
  } else if (request.action === 'LOAD_MODEL') {
    console.log('Background (v5): LOAD_MODEL action received.');
    updatePopupStatus('loading', 'Model loading initiated by LOAD_MODEL action (v5 test).');
    sendResponse({ success: true, message: `LOAD_MODEL received, updatePopupStatus called (v5 test).` });
    return false;
  } else if (request.action === 'CHECK_OFFSCREEN_STATUS') {
    console.log('Background (v5): CHECK_OFFSCREEN_STATUS action received.');
    (async () => {
      try {
        const hasDoc = await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
        console.log(`Background (v5): hasOffscreenDocument result: ${hasDoc}`);
        sendResponse({ success: true, hasOffscreenDocument: hasDoc });
      } catch (error) {
        console.error('Background (v5): Error in CHECK_OFFSCREEN_STATUS:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates an asynchronous response.
  } else {
    console.log('Background (v5): Received other action:', request.action);
    sendResponse({ success: false, message: `Action ${request.action} received but not processed in v5.` });
    return false;
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('llm-proxy-ext: onInstalled event triggered (v5).', details);
  if (details.reason === 'install') {
    console.log('llm-proxy-ext: First install (v5).');
    chrome.storage.local.set({ modelStatus: 'not_loaded', modelPath: MODEL_FILE_PATH, modelStatusMessage: 'Extension installed. Model not loaded.' });
    updatePopupStatus('not_loaded', 'Extension installed. Model not loaded.');
  } else if (details.reason === 'update') {
    console.log('llm-proxy-ext: Extension updated to version (v5)', chrome.runtime.getManifest().version);
    chrome.storage.local.set({ modelPath: MODEL_FILE_PATH });
  }
});

console.log('llm-proxy-ext: Background SW initial execution complete (v5)');
