/**
 * @file popup.js
 * @description Extension popup UI controller
 *
 * Manages the popup interface for the llama.cpp Chrome extension.
 * Handles user input, model loading requests, and displays inference results.
 *
 * @author llama-cpp-wasm-qwen3
 * @license MIT
 */

/**
 * Initialize the popup when DOM is ready.
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLTextAreaElement} */
  const promptInput = document.getElementById('promptInput');

  /** @type {HTMLButtonElement} */
  const sendButton = document.getElementById('sendButton');

  /** @type {HTMLButtonElement|null} */
  const loadModelButton = document.getElementById('loadModelButton');

  /** @type {HTMLDivElement} */
  const responseArea = document.getElementById('responseArea');

  /** @type {HTMLSpanElement} */
  const modelStatusSpan = document.getElementById('modelStatus');

  /** @type {HTMLButtonElement|null} */
  const checkOffscreenButton = document.getElementById('checkOffscreenButton');

  /** @type {HTMLSpanElement|null} */
  const offscreenStatusSpan = document.getElementById('offscreenStatus');

  // Bail out if required elements are missing
  if (!promptInput || !sendButton || !responseArea || !modelStatusSpan) {
    console.error('Missing required DOM elements');
    return;
  }

  /**
   * Appends a message to the response area.
   *
   * @param {string} text - Message content
   * @param {string} [type='info'] - CSS class for styling: 'info' | 'error' | 'status' | 'user-prompt' | 'model-response'
   */
  function addMessage(text, type = 'info') {
    const p = document.createElement('p');
    p.textContent = text;
    p.className = type;
    responseArea.appendChild(p);
    responseArea.scrollTop = responseArea.scrollHeight;
  }

  /**
   * Sets the loading state of a button.
   *
   * @param {HTMLButtonElement|null} button - Target button element
   * @param {boolean} loading - Whether to show loading state
   */
  function setButtonLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    button.classList.toggle('loading', loading);
  }

  // Restore persisted model status
  chrome.storage.local.get('modelStatus', (data) => {
    modelStatusSpan.textContent = data.modelStatus || 'not_loaded';
  });

  /**
   * Handles status updates from the background script.
   * @listens chrome.runtime.onMessage
   */
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'UPDATE_MODEL_STATUS') {
      modelStatusSpan.textContent = request.status;

      if (request.message) {
        addMessage(`Status: ${request.message}`, 'status');
      }

      const isLoading = request.status === 'loading';
      const isReady = request.status === 'loaded';

      setButtonLoading(loadModelButton, isLoading);
      sendButton.disabled = isLoading || !isReady;
    }
    return false;
  });

  /**
   * Sends the user's prompt to the model.
   * @listens click
   */
  sendButton.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    addMessage(`You: ${prompt}`, 'user-prompt');
    promptInput.value = '';
    setButtonLoading(sendButton, true);

    chrome.runtime.sendMessage({ action: 'SEND_PROMPT', prompt }, (response) => {
      setButtonLoading(sendButton, false);

      if (chrome.runtime.lastError) {
        addMessage(`Error: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }

      if (response && response.success) {
        addMessage(`Model: ${response.response}`, 'model-response');
      } else {
        addMessage(`Error: ${response?.message || 'No response'}`, 'error');
      }
    });
  });

  /**
   * Initiates model loading.
   * @listens click
   */
  if (loadModelButton) {
    loadModelButton.addEventListener('click', () => {
      addMessage('Loading model...', 'status');
      modelStatusSpan.textContent = 'loading...';
      setButtonLoading(loadModelButton, true);

      chrome.runtime.sendMessage({ action: 'LOAD_MODEL' }, (response) => {
        if (chrome.runtime.lastError) {
          addMessage(`Error: ${chrome.runtime.lastError.message}`, 'error');
          modelStatusSpan.textContent = 'error';
          setButtonLoading(loadModelButton, false);
          return;
        }

        if (response && response.success) {
          addMessage(response.message, 'status');
        } else {
          addMessage(`Failed: ${response?.message || 'Unknown error'}`, 'error');
          modelStatusSpan.textContent = 'error';
          setButtonLoading(loadModelButton, false);
        }
      });
    });
  }

  // Verify background script connection
  chrome.runtime.sendMessage({ action: 'PING' }, (response) => {
    if (chrome.runtime.lastError) {
      addMessage('Background script not responding.', 'warning');
    } else if (response?.message === 'PONG from background script') {
      addMessage('Connected to background.', 'status');
    }
  });

  /**
   * Debug button to check offscreen document status.
   * @listens click
   */
  if (checkOffscreenButton && offscreenStatusSpan) {
    checkOffscreenButton.addEventListener('click', () => {
      addMessage('Checking offscreen status...', 'status');
      offscreenStatusSpan.textContent = 'checking...';

      chrome.runtime.sendMessage({ action: 'CHECK_OFFSCREEN_STATUS' }, (response) => {
        if (chrome.runtime.lastError) {
          offscreenStatusSpan.textContent = 'Error';
          addMessage(`Error: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }

        if (response && response.success) {
          const status = response.hasOffscreenDocument ? 'Active' : 'Not found';
          offscreenStatusSpan.textContent = status;
          addMessage(`Offscreen: ${status}`, 'status');
        } else {
          offscreenStatusSpan.textContent = 'Error';
          addMessage(`Failed: ${response?.error || 'Unknown'}`, 'error');
        }
      });
    });
  }

  /**
   * Handle Enter key to submit prompt.
   * Shift+Enter inserts a newline instead.
   * @listens keypress
   */
  promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
});
