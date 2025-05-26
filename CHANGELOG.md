# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial project setup for Chrome Extension (Manifest V3).
- Created `manifest.json`, `popup.html`, `popup.js`, `popup.css`, and initial `background.js`.
- Copied `llama-cpp-wasm` library files (`llama.js`, `main-worker.js`, `main.wasm`, etc.) into `extension/js/lib/`.
- Copied Qwen model file (`Qwen3-0.6B-UD-Q8_K_XL.gguf`) into `extension/models/`.
- Implemented basic message passing between popup and background script.
- Added placeholder icons and then switched to using `ic_forum_24px.svg`.
- **Introduced Offscreen Document Architecture**:
  - Created `extension/html/offscreen.html` and `extension/js/offscreen.js`.
  - `offscreen.js` now hosts `LlamaCpp` instance to enable Web Worker usage.
  - Refactored `background.js` to manage the offscreen document and act as a message broker between the popup and `offscreen.js`.
  - Updated `manifest.json` with `"offscreen"` permission and set `"type": "module"` for `background.js`.
  - Made `main.wasm` and model files web accessible in `manifest.json`.

### Changed
- Renamed extension to "llm-proxy-ext" and updated relevant files (`manifest.json`, `popup.html`, console logs in `background.js` and `offscreen.js`).
- Updated `background.js` to correctly load the Qwen model file path.
- Updated `manifest.json` to use SVG icon and set service worker type to module.

### Fixed
- Resolved initial extension loading errors related to missing icons.
- Addressed "Cannot use import statement outside a module" error in `background.js`.
- Addressed "Worker is not defined" error by moving `LlamaCpp` instantiation to an offscreen document.

