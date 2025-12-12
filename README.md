# llama-cpp-wasm-qwen3

Run Qwen3 language models entirely in the browser using WebAssembly.

## Features

- **No server required** - Everything runs client-side
- **Web Worker threading** - UI stays responsive during inference
- **Model caching** - Downloads cached via Cache API
- **Two interfaces** - Standalone web demo and Chrome extension

## Quick Start

### Browser Demo

```bash
# Clone repo
git clone https://github.com/anthropics/llama-cpp-wasm-qwen3.git
cd llama-cpp-wasm-qwen3

# Download WASM assets
chmod +x scripts/download_llama_cpp_wasm_assets.sh
./scripts/download_llama_cpp_wasm_assets.sh

# Download model (example)
mkdir -p qwen3-browser-demo/models
# Place your Qwen3 GGUF model here

# Start server
cd qwen3-browser-demo
npx http-server -p 8080 --cors -c-1

# Open http://localhost:8080
```

### Chrome Extension

1. Copy WASM files to `extension/js/lib/`:
   ```bash
   cp qwen3-browser-demo/llama-mt/main.js extension/js/lib/
   cp qwen3-browser-demo/llama-mt/main.wasm extension/js/lib/
   ```

2. Add model to `extension/models/`:
   ```bash
   mkdir -p extension/models
   # Copy your .gguf file here
   ```

3. Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/` directory

4. Click the extension icon and "Load Model"

## Project Structure

```
.
├── extension/              # Chrome extension (MV3)
│   ├── manifest.json
│   ├── html/               # Popup and offscreen HTML
│   ├── css/                # Styles
│   ├── js/
│   │   ├── popup.js        # Popup UI
│   │   ├── background.js   # Service worker
│   │   ├── offscreen.js    # Worker host
│   │   └── lib/            # WASM runtime
│   └── models/             # Model files (not in git)
│
├── qwen3-browser-demo/     # Standalone web demo
│   ├── index.html
│   ├── llama-mt/           # WASM runtime
│   └── models/             # Model files (not in git)
│
├── llama-cpp-wasm/         # Build scripts for WASM
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   └── API.md
│
└── scripts/                # Setup scripts
```

## Usage

### JavaScript API

```javascript
import { LlamaCpp } from './llama-mt/llama.js';

const llm = new LlamaCpp(
  '/models/qwen3.gguf',
  () => console.log('Model ready'),
  (token) => process.stdout.write(token),
  () => console.log('Done')
);

llm.run({
  prompt: 'Write a haiku about code:',
  n_predict: 50,
  temp: 0.7
});
```

See [docs/API.md](docs/API.md) for full API reference.

## Recommended Models

| Model | Size | Notes |
|-------|------|-------|
| Qwen3-0.6B-Q4_K_M | ~350MB | Best for speed |
| Qwen3-0.6B-Q8_0 | ~650MB | Better quality |

Download from [Hugging Face](https://huggingface.co/Qwen).

## Requirements

- Chrome 116+ (for extension)
- Modern browser with WebAssembly support
- ~1GB RAM minimum

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and message flow
- [Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [API Reference](docs/API.md) - JavaScript API documentation

## Building WASM

To rebuild the llama.cpp WebAssembly module:

```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Build
cd llama-cpp-wasm
./build-multi-thread.sh
```

## License

MIT

## Acknowledgments

- [llama.cpp](https://github.com/ggerganov/llama.cpp)
- [llama-cpp-wasm](https://github.com/tangledgroup/llama-cpp-wasm)
- [Qwen](https://huggingface.co/Qwen)
