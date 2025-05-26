// popup.js - Logic for the Qwen3 Extension popup

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup: DOMContentLoaded event fired. popup.js starting.'); // <-- ADD THIS LOG
  const promptInput = document.getElementById('promptInput');
  const sendButton = document.getElementById('sendButton');
  const loadModelButton = document.getElementById('loadModelButton');
  const responseArea = document.getElementById('responseArea');
  const modelStatusSpan = document.getElementById('modelStatus');

  // Function to add messages to the response area
  function addMessageToResponseArea(text, type = 'info') {
    const messageElement = document.createElement('p');
    messageElement.textContent = text;
    messageElement.className = type; // for styling (e.g., 'user-prompt', 'model-response', 'error')
    responseArea.appendChild(messageElement);
    responseArea.scrollTop = responseArea.scrollHeight; // Scroll to the bottom
  }

  // Check initial model status from storage
  chrome.storage.local.get('modelStatus', (data) => {
    modelStatusSpan.textContent = data.modelStatus || 'not_loaded';
  });

  // Listen for model status updates from background script (if we implement this)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'UPDATE_MODEL_STATUS') {
      modelStatusSpan.textContent = request.status;
      chrome.storage.local.set({ modelStatus: request.status });
      if (request.message) {
        addMessageToResponseArea(`Status: ${request.message}`, 'status');
      }
    }
  });

  // Handle Send button click
  sendButton.addEventListener('click', () => {
    const promptText = promptInput.value.trim();
    if (promptText) {
      addMessageToResponseArea(`You: ${promptText}`, 'user-prompt');
      promptInput.value = ''; // Clear input field

      chrome.runtime.sendMessage({ action: 'SEND_PROMPT', prompt: promptText }, (response) => {
        if (chrome.runtime.lastError) {
          addMessageToResponseArea(`Error: ${chrome.runtime.lastError.message}`, 'error');
          console.error('Error sending message:', chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          addMessageToResponseArea(`Model: ${response.response}`, 'model-response');
        } else {
          addMessageToResponseArea(`Error: ${response ? response.message : 'No response from background.'}`, 'error');
        }
      });
    }
  });

  // Handle Load Model button click
  loadModelButton.addEventListener('click', () => {
    addMessageToResponseArea('Attempting to load model...', 'status');
    modelStatusSpan.textContent = 'loading...';
    chrome.storage.local.set({ modelStatus: 'loading' });

    console.log('Popup: Sending LOAD_MODEL message to background script.'); // <-- ADD THIS LOG
    chrome.runtime.sendMessage({ action: 'LOAD_MODEL' }, (response) => {
      if (chrome.runtime.lastError) {
        addMessageToResponseArea(`Error: ${chrome.runtime.lastError.message}`, 'error');
        modelStatusSpan.textContent = 'error';
        chrome.storage.local.set({ modelStatus: 'error' });
        console.error('Error sending LOAD_MODEL message:', chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        addMessageToResponseArea(response.message, 'status');
        // Background script should send 'UPDATE_MODEL_STATUS' for more detailed status changes
      } else {
        addMessageToResponseArea(`Failed to start model loading: ${response ? response.message : 'No response.'}`, 'error');
        modelStatusSpan.textContent = 'error';
        chrome.storage.local.set({ modelStatus: 'error' });
      }
    });
  });

  // Optional: Ping the background script to check if it's alive
  chrome.runtime.sendMessage({ action: 'PING' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('Could not ping background script:', chrome.runtime.lastError.message);
      addMessageToResponseArea('Background script might not be active.', 'warning');
    } else if (response && response.message === 'PONG from background script') {
      console.log('Background script responded to PING.');
      addMessageToResponseArea('Connected to background script.', 'status');
    } else {
      console.warn('Unexpected PING response:', response);
    }
  });

  // Allow sending prompt with Enter key
  promptInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line
      sendButton.click();
    }
  });
});
