// background.js - Service Worker for Qwen3 Llama.cpp Wasm Extension

console.log('Qwen3 Extension Background Service Worker started.');

// Placeholder for llama-cpp-wasm initialization and model loading
async function initializeModel() {
  console.log('Attempting to initialize model...');
  // TODO: Adapt llama-cpp-wasm loading logic here
  // This will involve:
  // 1. Importing or loading the llama.js script from llama-cpp-wasm
  // 2. Setting up the worker paths for llama-cpp-wasm
  // 3. Instantiating the LlamaCpp class
}

// Listener for messages from popup or other extension components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background script:', request);

  if (request.action === 'PING') {
    console.log('Received PING from:', sender);
    sendResponse({ message: 'PONG from background script' });
    return true; // Indicates that the response will be sent asynchronously
  }

  if (request.action === 'LOAD_MODEL') {
    initializeModel().then(() => {
      sendResponse({ success: true, message: 'Model initialization process started.' });
    }).catch(error => {
      console.error('Model initialization failed:', error);
      sendResponse({ success: false, message: 'Model initialization failed.', error: error.message });
    });
    return true; // Indicates that the response will be sent asynchronously
  }

  if (request.action === 'SEND_PROMPT') {
    const prompt = request.prompt;
    console.log('Received prompt:', prompt);
    // TODO: Implement prompt processing with the loaded model
    // For now, just echo back
    sendResponse({ success: true, response: `Background received: "${prompt}". Model processing not yet implemented.` });
    return true;
  }

  // Default response for unhandled actions
  sendResponse({ success: false, message: 'Unknown action' });
  return true; 
});

// Optional: Perform some action on extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Qwen3 Extension installed.');
    // Perform first-time setup, e.g., initialize storage
    chrome.storage.local.set({ modelStatus: 'not_loaded' });
  } else if (details.reason === 'update') {
    console.log('Qwen3 Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Attempt to initialize the model when the service worker starts
// This might be too early if wasm files are not yet available or if it's resource-intensive
// Consider triggering this from the popup or a user action.
// initializeModel();
