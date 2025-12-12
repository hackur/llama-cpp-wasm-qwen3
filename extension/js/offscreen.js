/**
 * Offscreen document for hosting wllama WASM worker
 * Chrome MV3 requires offscreen documents to run persistent workers.
 */

import { Wllama } from './wllama/index.js';

console.log('[Offscreen] Script loaded');

let wllama = null;
let isInitializing = false;
let modelLoaded = false;

function sendToBackground(message) {
  chrome.runtime.sendMessage(message).catch(e => {
    console.error('[Offscreen] Send error:', e.message);
  });
}

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
    const configPaths = {
      'single-thread/wllama.wasm': chrome.runtime.getURL('js/wllama/single-thread/wllama.wasm'),
      'multi-thread/wllama.wasm': chrome.runtime.getURL('js/wllama/multi-thread/wllama.wasm'),
    };

    wllama = new Wllama(configPaths, { allowOffline: true });

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

async function runPrompt(prompt) {
  if (!modelLoaded || !wllama) {
    sendToBackground({ action: 'OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT' });
    return;
  }

  console.log('[Offscreen] Running prompt');

  try {
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
