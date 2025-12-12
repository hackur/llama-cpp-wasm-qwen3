# Architecture

This document describes the architecture of the llama-cpp-wasm-qwen3 project.

## Overview

The project provides two ways to run Qwen3 language models in the browser:

1. **Chrome Extension** - A popup-based interface for quick access
2. **Standalone Demo** - A web page for testing and development

Both use the same underlying llama.cpp WebAssembly runtime.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    messages    ┌──────────────────────────┐   │
│  │   popup.js   │ ◄────────────► │    background.js         │   │
│  │   (UI)       │                │    (Service Worker)      │   │
│  └──────────────┘                └────────────┬─────────────┘   │
│                                               │                  │
│                                    messages   │                  │
│                                               ▼                  │
│                                  ┌──────────────────────────┐   │
│                                  │     offscreen.js         │   │
│                                  │  (Offscreen Document)    │   │
│                                  └────────────┬─────────────┘   │
│                                               │                  │
│                                    import     │                  │
│                                               ▼                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    lib/llama.js                           │   │
│  │                  (LlamaCpp Class)                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│                Worker     │                                      │
│              postMessage  │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                lib/main-worker.js                         │   │
│  │               (Web Worker Thread)                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│                  import   │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   lib/main.js                             │   │
│  │               (Emscripten Module)                         │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│                  loads    │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  lib/main.wasm                            │   │
│  │              (llama.cpp WASM Binary)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Message Flow

### Model Loading

```
popup.js                 background.js           offscreen.js          main-worker.js
   │                          │                       │                      │
   │──LOAD_MODEL────────────► │                       │                      │
   │                          │──OFFSCREEN_INIT_MODEL─►│                      │
   │                          │                       │───creates───────────►│
   │                          │                       │                      │
   │                          │                       │    [loads WASM]      │
   │                          │                       │    [loads model]     │
   │                          │                       │                      │
   │                          │                       │◄──INITIALIZED────────│
   │                          │◄─OFFSCREEN_MODEL_LOADED│                      │
   │◄─UPDATE_MODEL_STATUS────│                       │                      │
```

### Inference

```
popup.js                 background.js           offscreen.js          main-worker.js
   │                          │                       │                      │
   │──SEND_PROMPT───────────► │                       │                      │
   │                          │──OFFSCREEN_RUN_PROMPT─►│                      │
   │                          │                       │───RUN_MAIN──────────►│
   │                          │                       │                      │
   │                          │                       │    [runs inference]  │
   │                          │                       │                      │
   │                          │                       │◄──WRITE_RESULT───────│ (repeated)
   │                          │                       │◄──RUN_COMPLETED──────│
   │                          │◄─OFFSCREEN_MODEL_RESPONSE                    │
   │◄─response────────────────│                       │                      │
```

## Key Components

### popup.js
- Renders the extension popup UI
- Sends user prompts to the background script
- Displays model responses and status

### background.js
- Chrome MV3 service worker
- Routes messages between popup and offscreen document
- Manages offscreen document lifecycle
- Persists model status to chrome.storage

### offscreen.js
- Runs in an offscreen document (required for persistent workers in MV3)
- Instantiates and manages the LlamaCpp wrapper
- Buffers token responses until inference completes

### lib/llama.js
- High-level wrapper for llama.cpp
- Creates and manages the Web Worker
- Provides callback-based API for initialization and inference

### lib/main-worker.js
- Runs in a dedicated Web Worker thread
- Loads the WASM module and model file
- Executes inference via Emscripten's callMain()
- Streams tokens to main thread via postMessage

### lib/main.js + main.wasm
- Emscripten-compiled llama.cpp
- Provides the actual inference engine

## Threading Model

```
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│    Main Thread     │     │   Worker Thread    │     │   WASM Threads     │
│                    │     │                    │     │   (if available)   │
│  - UI rendering    │     │  - Model loading   │     │  - Parallel matrix │
│  - Event handling  │     │  - Inference       │     │    operations      │
│  - Message routing │     │  - Token streaming │     │                    │
└────────────────────┘     └────────────────────┘     └────────────────────┘
```

The Web Worker prevents the UI from freezing during model loading (~30s) and inference. If SharedArrayBuffer is available (requires secure context + COOP/COEP headers), the WASM module uses additional threads for parallel computation.

## File Organization

```
extension/
├── manifest.json          # Chrome extension manifest (MV3)
├── html/
│   ├── popup.html         # Popup UI markup
│   └── offscreen.html     # Offscreen document (loads worker)
├── css/
│   └── popup.css          # Popup styles
├── js/
│   ├── popup.js           # Popup logic
│   ├── background.js      # Service worker
│   ├── offscreen.js       # Offscreen document script
│   └── lib/
│       ├── llama.js       # LlamaCpp wrapper class
│       ├── main-worker.js # Web Worker
│       ├── main.js        # Emscripten glue code
│       ├── main.wasm      # Compiled llama.cpp
│       ├── actions.js     # Message action constants
│       └── utility.js     # Cache/fetch utilities
└── models/
    └── *.gguf             # Model files (not in git)
```
