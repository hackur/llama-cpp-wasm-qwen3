// background.js - Service Worker (Reintroducing onInstalled and constants)
console.log('llm-proxy-ext: Background SW started (v3)');

const MODEL_FILE_PATH = 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf';
const OFFSCREEN_DOCUMENT_PATH = 'html/offscreen.html';

// let creatingOffscreenPromise = null; // Still commented out
// let popupSendResponse = null; // Still commented out

/* // Functions still commented out
function updatePopupStatus(status, message = '') { ... }
async function hasOffscreenDocument(path) { ... }
async function setupOffscreenDocument() { ... }
*/

// Listener for messages from popup or offscreen document
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background (v3): Message received:', request, 'From:', sender.url || sender.id);

  if (request.action === 'PING') {
    console.log('Background (v3): Received PING from popup.');
    sendResponse({ message: 'PONG from background script (v3)' });
    return false; // Synchronous response
  } else {
    console.log('Background (v3): Received other action:', request.action);
    // For now, just acknowledge other actions without processing
    if (sendResponse) {
        sendResponse({ success: false, message: `Action ${request.action} received but not processed in v3.` });
    }
  }
  return true; // Keep open for potential async response
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('llm-proxy-ext: onInstalled event triggered.', details);
  if (details.reason === 'install') {
    console.log('llm-proxy-ext: First install.');
    chrome.storage.local.set({ modelStatus: 'not_loaded', modelPath: MODEL_FILE_PATH });
  } else if (details.reason === 'update') {
    console.log('llm-proxy-ext: Extension updated to version', chrome.runtime.getManifest().version);
    // Potentially re-set or migrate storage if needed on update
    chrome.storage.local.set({ modelPath: MODEL_FILE_PATH }); // Ensure modelPath is set
  }
  // Consider if offscreen document should be created here if it's always needed
  // setupOffscreenDocument(); 
});

console.log('llm-proxy-ext: Background SW initial execution complete (v3)');
