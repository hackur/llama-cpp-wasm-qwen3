# Chrome Extension Development Plan: llm-proxy-ext (using Qwen3 with llama-cpp-wasm)

This document outlines the comprehensive plan for developing the llm-proxy-ext Chrome extension, initially using Qwen3 with llama-cpp-wasm. It includes detailed steps, implementation notes, and technical requirements.

## Project Overview

We're building the llm-proxy-ext, a Chrome extension that allows users to interact with LLMs, starting with the Qwen3 0.6B language model locally in their browser. The extension will leverage the existing llama-cpp-wasm implementation but adapt it to work within the Chrome extension architecture using Manifest V3.

## Development Tasks

### Task 1: Set up development environment for Chrome extension

**Description**: Prepare the development environment and folder structure for the Chrome extension project.

**Subtasks**:
1. **Analyze existing code structure** 
   - Review `qwen3-browser-demo/llama-mt/actions.js` to understand action types and messaging
   - Examine `qwen3-browser-demo/llama-mt/llama.js` to understand the API for model interaction
   - Study `qwen3-browser-demo/llama-mt/main-worker.js` to understand worker implementation

2. **Research Chrome extension Manifest V3 requirements**
   - Study service worker limitations and lifecycle
   - Understand Chrome extension security model
   - Research best practices for WebAssembly in Chrome extensions
   - Investigate communication patterns between extension components

3. **Create Chrome extension directory structure**
   - Set up `extension/` as the root directory
   - Create folders for `background/`, `popup/`, and `assets/`
   - Initialize Git repository with appropriate `.gitignore`

4. **Set up development tooling**
   - Configure build tools (webpack/esbuild) if necessary
   - Set up linting and formatting tools
   - Configure Chrome extension debugging environment

5. **Prepare model deployment strategy**
   - Decide on model packaging approach (bundled or downloadable)
   - Determine storage requirements and limitations
   - Plan for model loading optimization

### Task 2: Create manifest.json file

**Description**: Develop the manifest.json file that defines the Chrome extension properties, permissions, and structure.

**Subtasks**:
1. **Define basic extension metadata**
   - Set name, description, version, and author information
   - Configure appropriate icons at different sizes

2. **Configure extension permissions**
   - Determine minimum required permissions
   - Add storage permissions for model and configuration
   - Configure appropriate host permissions if needed

3. **Set up background service worker**
   - Configure service worker registration
   - Define appropriate persistent background context

4. **Configure action and popup settings**
   - Set default popup HTML file
   - Configure default icon and action behavior

5. **Add web accessible resources**
   - Configure access to WebAssembly files
   - Set up access to model file(s)

6. **Define content security policy**
   - Configure appropriate CSP for WebAssembly
   - Set up worker-src policy for WebWorkers

### Task 3: Develop Background Script (`background.js`)

**Description**: Implement the background service worker to manage the offscreen document, act as a message broker between the popup and the offscreen document, and handle overall extension lifecycle events.

**Subtasks**:
1.  **Implement Offscreen Document Management**
    -   Develop logic to create and manage the lifecycle of `offscreen.html`.
    -   Ensure only one offscreen document instance is active.
    -   Handle errors during offscreen document creation/termination.

2.  **Set up Messaging Infrastructure (Broker)**
    -   Define message handlers to receive requests from `popup.js` (e.g., load model, send prompt).
    -   Relay these requests to the offscreen document.
    -   Receive responses/status updates from `offscreen.js`.
    -   Relay these responses/status updates back to `popup.js`.
    -   Manage `sendResponse` callbacks for asynchronous message handling.

3.  **Implement Status Management**
    -   Use `chrome.storage.local` to store and update the model's status (e.g., `not_loaded`, `loading`, `loaded`, `error`).
    -   Provide functions to update the popup UI with the current model status.

4.  **Handle Extension Lifecycle Events**
    -   `onInstalled`: Initialize default settings (e.g., model status).
    -   Consider any necessary actions on extension updates.

### Task 3.5: Develop Offscreen Document (`offscreen.html`, `offscreen.js`)

**Description**: Create the offscreen document environment to host the `LlamaCpp` instance and its Web Workers, enabling model loading and inference outside the service worker's restricted context.

**Subtasks**:
1.  **Create `offscreen.html`**
    -   Minimal HTML structure to load `offscreen.js`.

2.  **Implement `offscreen.js` Logic**
    -   Import and instantiate `LlamaCpp` from `js/lib/llama.js`.
    -   Handle `LlamaCpp` initialization, including providing model URL and callbacks.
    -   Set up message listeners to receive commands from `background.js` (e.g., `OFFSCREEN_INIT_MODEL`, `OFFSCREEN_RUN_PROMPT`).

3.  **Implement Model Interaction Logic**
    -   Manage the `LlamaCpp` instance lifecycle within the offscreen document.
    -   Process model loading requests, including fetching the model file via `chrome.runtime.getURL()`.
    -   Handle prompt execution requests.
    -   Collect model responses (potentially streaming).

4.  **Communicate with Background Script**
    -   Send status updates to `background.js` (e.g., `OFFSCREEN_MODEL_LOADED`, `OFFSCREEN_MODEL_INIT_ERROR`, `OFFSCREEN_MODEL_RESPONSE`).
    -   Report any errors encountered during model operations.

### Task 4: Develop popup UI (popup.html, popup.js)

**Description**: Create a user interface for entering prompts and displaying responses from the Qwen model.

**Subtasks**:
1. **Design basic popup layout**
   - Create responsive HTML structure
   - Implement CSS styling with consideration for light/dark themes
   - Add appropriate loading states and indicators

2. **Implement user input components**
   - Create prompt input field with appropriate validation
   - Add submit button and keyboard shortcuts
   - Implement parameter adjustment controls if needed

3. **Develop response display area**
   - Create scrollable response container
   - Implement markdown/formatting support if needed
   - Add copy-to-clipboard functionality

4. **Add conversation history view**
   - Implement conversation threading UI
   - Create conversation persistence mechanism
   - Add history navigation controls

5. **Implement settings UI components**
   - Create model parameter adjustment controls
   - Add theme toggle and UI preferences
   - Implement any extension-specific configuration options

### Task 5: Implement communication channel between popup and background script

**Description**: Establish a communication channel using Chrome's messaging API for passing user prompts and model responses.

**Subtasks**:
1. **Define message protocol**
   - Create message type definitions
   - Implement serialization/deserialization if needed
   - Document message format specifications

2. **Implement background script message handlers**
   - Create message listeners in service worker
   - Add response routing logic
   - Implement error handling for messaging failures

3. **Create popup script message handlers**
   - Implement Chrome messaging API integration
   - Add message composition logic
   - Create response processing pipeline

4. **Set up streaming response mechanism**
   - Implement token-by-token streaming interface
   - Add support for cancellation and timeouts
   - Create appropriate UI feedback for streaming status

5. **Add connection state management**
   - Implement reconnection logic for service worker restarts
   - Add health check mechanisms
   - Create user feedback for connection state changes

### Task 6: Implement Model Loading (Primarily in Offscreen Document)

**Description**: Create a mechanism for loading the Qwen3 GGUF model. The core loading logic will reside in `offscreen.js`, initiated and managed via `background.js`.

**Subtasks**:
1.  **Model File Accessibility**
    -   Ensure the model file (e.g., `models/Qwen3-0.6B-UD-Q8_K_XL.gguf`) is correctly placed in the extension package.
    -   Verify `web_accessible_resources` in `manifest.json` allows the offscreen document/workers to fetch the model and `main.wasm`.

2.  **Initiate Loading from Popup/Background**
    -   Popup sends `LOAD_MODEL` message to `background.js`.
    -   `background.js` ensures the offscreen document is running and relays an `OFFSCREEN_INIT_MODEL` message to `offscreen.js`, providing the model URL (obtained via `chrome.runtime.getURL()`).

3.  **Implement Model Loading in `offscreen.js`**
    -   `offscreen.js` receives the model URL and passes it to the `LlamaCpp` constructor.
    -   `LlamaCpp` (in `js/lib/llama.js`) handles fetching the model and `main.wasm`, and instantiating the Web Worker (`js/lib/main-worker.js`).
    -   Handle errors during fetching or WebAssembly compilation.

4.  **Status Reporting**
    -   `offscreen.js` reports loading progress/status (e.g., `OFFSCREEN_MODEL_LOADED`, `OFFSCREEN_MODEL_INIT_ERROR`) back to `background.js`.
    -   `background.js` relays this status to `popup.js` for UI updates.

5.  **Model Caching (Consideration for Future)**
    -   Currently, the model is bundled. If dynamic downloading were implemented, caching via `chrome.storage.local` or IndexedDB would be relevant here (managed by offscreen/background).

### Task 7: Test basic functionality of the Chrome extension

**Description**: Test that users can enter prompts, send them to the background script, and receive responses from the Qwen model.

**Subtasks**:
1. **Create test plan**
   - Define test scenarios and expected outcomes
   - Create test prompts with expected behaviors
   - Document testing methodology

2. **Test popup UI functionality**
   - Verify input field behavior and validation
   - Test response display and formatting
   - Evaluate UI responsiveness and usability

3. **Test background script operations**
   - Verify model loading and initialization
   - Test inference pipeline with various inputs
   - Evaluate memory usage and performance

4. **Test communication channel**
   - Verify message passing between components
   - Test error handling and recovery
   - Evaluate streaming performance

5. **Document test results**
   - Create test report with findings
   - Document any issues or limitations
   - Prioritize fixes and enhancements

### Task 8: Optimize performance of the Chrome extension

**Description**: Improve performance by reducing background script startup time, minimizing the Qwen model's memory footprint, and enhancing popup UI responsiveness.

**Subtasks**:
1. **Profile extension performance**
   - Measure model loading time
   - Analyze memory usage patterns
   - Identify UI bottlenecks

2. **Optimize WebAssembly loading**
   - Implement lazy loading where appropriate
   - Optimize WebAssembly instantiation
   - Reduce unnecessary re-initialization

3. **Improve model inference efficiency**
   - Optimize batch size and context window
   - Implement model parameter tuning
   - Reduce unnecessary computations

4. **Enhance UI performance**
   - Optimize DOM updates for response streaming
   - Implement virtualization for long conversations
   - Reduce render-blocking operations

5. **Implement caching strategies**
   - Add response caching where appropriate
   - Implement asset caching
   - Optimize persistence layer performance

### Task 9: Conduct security review of the Chrome extension

**Description**: Perform a thorough security review to identify and address potential vulnerabilities in the Chrome extension.

**Subtasks**:
1. **Analyze permission usage**
   - Review all requested permissions
   - Ensure principle of least privilege is followed
   - Document justification for each permission

2. **Review content security policy**
   - Verify CSP is properly configured
   - Check for potential bypasses
   - Ensure secure context for sensitive operations

3. **Audit data handling practices**
   - Review user data storage
   - Verify proper encryption where needed
   - Check for potential data leakage

4. **Evaluate WebAssembly security**
   - Review memory safety
   - Check for potential exploits
   - Verify proper isolation

5. **Document security findings**
   - Create security report
   - Prioritize security fixes
   - Implement recommended mitigations

### Task 10: Create production build and package the Chrome extension

**Description**: Prepare the Chrome extension for distribution by creating a production build, optimizing assets, and packaging it for submission to the Chrome Web Store.

**Subtasks**:
1. **Set up build pipeline**
   - Configure asset optimization
   - Set up minification and bundling
   - Implement versioning system

2. **Create extension package**
   - Generate production manifest
   - Bundle all required assets
   - Create ZIP package for submission

3. **Prepare store listing materials**
   - Create promotional images
   - Write store description
   - Develop privacy policy document

4. **Test production package**
   - Verify functionality in production mode
   - Test installation process
   - Confirm all features work as expected

5. **Document release process**
   - Create release checklist
   - Document version update procedures
   - Define hotfix protocol

## Technical Requirements

1. **Chrome Extension**
   - Must use Manifest V3
   - Should work in Chrome 88+
   - Must handle service worker lifecycle appropriately

2. **Model Integration**
   - Must use llama-cpp-wasm for model inference
   - Should support Qwen3 0.6B model
   - Must handle WebAssembly loading in extension context

3. **User Interface**
   - Must provide intuitive chat interface
   - Should support conversation history
   - Must indicate model/extension status clearly

4. **Performance**
   - Should initialize within 5 seconds
   - Must provide streaming responses
   - Should handle memory efficiently

5. **Security**
   - Must use minimum required permissions
   - Should properly isolate WebAssembly execution
   - Must protect user data appropriately

## Next Steps

The implementation will follow the task order specified above, starting with Task 1 (Set up development environment) and proceeding sequentially through the plan. Dependencies between tasks have been established to ensure proper workflow.
