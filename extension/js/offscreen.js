// offscreen.js - Runs in the offscreen document to host LlamaCpp

// Note: '../lib/llama.js' path is relative to offscreen.html's location in 'html/' directory
// So, it should be '../js/lib/llama.js'
import { LlamaCpp } from './lib/llama.js'; // Corrected path relative to offscreen.js if it were in js/
                                       // If offscreen.js is in js/, then './lib/llama.js' is correct.
                                       // Let's assume offscreen.js is in js/ for now.
                                       // The HTML includes <script src="../js/offscreen.js">
                                       // So, if offscreen.js is in js/, then its import { LlamaCpp } from './lib/llama.js';

console.log('llm-proxy-ext (Offscreen): Script loaded. Waiting for messages.'); // [LOG 1]

let llamaCppInstance = null; // Will hold the LlamaCpp object
let currentModelResponse = '';
let isInitializing = false;
let modelSuccessfullyLoaded = false;

// Function to send messages back to the service worker (background.js)
function sendMessageToBackground(message) {
  // console.log('Offscreen: Sending message to background:', message);
  chrome.runtime.sendMessage(message).catch(e => console.error('Offscreen: Error sending message to background:', e.message, message));
}

// Callbacks for LlamaCpp
const init_callback = () => {
  console.log('Offscreen: LlamaCpp Initialized (init_callback fired). Model loaded and ready.'); // [LOG 5]
  isInitializing = false;
  modelSuccessfullyLoaded = true; 
  // llamaCppInstance is already assigned below by `new LlamaCpp(...)`
  console.log('Offscreen: Sending OFFSCREEN_MODEL_LOADED to background.'); // [LOG 6]
  sendMessageToBackground({ action: 'OFFSCREEN_MODEL_LOADED' });
};

const write_result_callback = (text_chunk) => {
  // console.log('Offscreen: write_result_callback chunk:', text_chunk); // [LOG 7 - verbose]
  currentModelResponse += text_chunk;
};

const on_complete_callback = () => {
  console.log('Offscreen: LlamaCpp Run Completed. Full response length:', currentModelResponse.length); // [LOG 8]
  console.log('Offscreen: Sending OFFSCREEN_MODEL_RESPONSE to background.'); // [LOG 9]
  sendMessageToBackground({ action: 'OFFSCREEN_MODEL_RESPONSE', response: currentModelResponse });
  currentModelResponse = ''; // Reset for next prompt
};

async function initializeLlama(modelUrl) {
  if (isInitializing) {
    console.log('Offscreen: Model initialization already in progress.'); // [LOG 3a]
    sendMessageToBackground({ action: 'OFFSCREEN_ALREADY_INITIALIZING' });
    return;
  }
  if (modelSuccessfullyLoaded) {
    console.log('Offscreen: Model already loaded.'); // [LOG 3b]
    // Inform background that it's already loaded, so popup gets 'loaded' status quickly.
    sendMessageToBackground({ action: 'OFFSCREEN_MODEL_LOADED' }); 
    return;
  }

  isInitializing = true;
  modelSuccessfullyLoaded = false;
  console.log('Offscreen: Received OFFSCREEN_INIT_MODEL with URL:', modelUrl); // [LOG 4]

  try {
    console.log('Offscreen: Attempting to instantiate LlamaCpp...'); // [LOG 10]
    llamaCppInstance = new LlamaCpp(modelUrl, init_callback, write_result_callback, on_complete_callback);
    console.log('Offscreen: LlamaCpp instantiation process started.'); // [LOG 11]
  } catch (error) {
    console.error('Offscreen: Error during LlamaCpp instantiation:', error); // [LOG 12]
    isInitializing = false;
    modelSuccessfullyLoaded = false;
    console.log('Offscreen: Sending OFFSCREEN_MODEL_INIT_ERROR to background.'); // [LOG 13]
    sendMessageToBackground({ action: 'OFFSCREEN_MODEL_INIT_ERROR', error: error.message });
  }
}

function runLlama(prompt) {
  console.log('Offscreen: Received OFFSCREEN_RUN_PROMPT with prompt:', prompt); // [LOG 14]
  if (!modelSuccessfullyLoaded || !llamaCppInstance) {
    console.error('Offscreen: Model not loaded or instance not available. Cannot process prompt. isInitializing:', isInitializing, 'modelSuccessfullyLoaded:', modelSuccessfullyLoaded); // [LOG 15]
    sendMessageToBackground({ action: 'OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT' });
    return;
  }
  if (isInitializing) { // Should be caught by !modelSuccessfullyLoaded but as an extra check
    console.error('Offscreen: Model is still initializing. Cannot process prompt yet.'); // [LOG 15b]
    sendMessageToBackground({ action: 'OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT', error: 'Model still initializing.' });
    return;
  }

  currentModelResponse = '';
  console.log('Offscreen: Calling llamaCppInstance.run()...'); // [LOG 16]
  try {
    if (llamaCppInstance && typeof llamaCppInstance.run === 'function') {
      llamaCppInstance.run({ prompt: prompt });
    } else {
      console.error('Offscreen: llamaCppInstance.run is not a function or instance is null. LlamaCpp might not be fully initialized or instance not stored correctly.'); // [LOG 17]
      sendMessageToBackground({ action: 'OFFSCREEN_MODEL_RUN_ERROR', error: 'llamaCppInstance.run not available.' });
    }
  } catch (error) {
    console.error('Offscreen: Error running model inference:', error); // [LOG 18]
    sendMessageToBackground({ action: 'OFFSCREEN_MODEL_RUN_ERROR', error: error.message });
  }
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Offscreen: Message received:', request); // [LOG 2]

  switch (request.action) {
    case 'OFFSCREEN_INIT_MODEL':
      if (request.modelUrl) {
        initializeLlama(request.modelUrl);
        sendResponse({ success: true, message: 'Offscreen: Model initialization started.'});
      } else {
        console.error('Offscreen: modelUrl not provided for OFFSCREEN_INIT_MODEL');
        sendResponse({ success: false, message: 'Offscreen: modelUrl missing.'});
      }
      break;
    case 'OFFSCREEN_RUN_PROMPT':
      if (request.prompt) {
        runLlama(request.prompt);
        // Response to background will be sent via on_complete_callback
        // sendResponse({ success: true, message: 'Offscreen: Prompt processing started.' });
        // No immediate sendResponse here, actual response is async
      } else {
        console.error('Offscreen: prompt not provided for OFFSCREEN_RUN_PROMPT');
        // sendResponse({ success: false, message: 'Offscreen: prompt missing.' });
      }
      break;
    default:
      console.warn('Offscreen: Unknown action received:', request.action);
      // sendResponse({ success: false, message: 'Offscreen: Unknown action.' });
      break;
  }
  // For most actions, the response to background.js is asynchronous (e.g., model loading, inference)
  // So, we don't use sendResponse here unless it's a quick synchronous acknowledgement.
  // It's generally better to use one-way messaging from background to offscreen for commands,
  // and then separate messages from offscreen to background for results/status.
  return false; // Keep this false if not using sendResponse or if it's one-way.
});

console.log('llm-proxy-ext (Offscreen): Event listeners attached. Script fully initialized.'); // [LOG 19]
console.log('Offscreen script event listeners set up.');
// Signal background that offscreen is ready (optional, but can be useful)
// sendMessageToBackground({ action: 'OFFSCREEN_READY' });
