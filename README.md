# Qwen3 0.6B with llama-cpp-wasm

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A web-based implementation of the Qwen3 0.6B language model using `llama-cpp-wasm`, enabling in-browser execution with tool calling and code suggestion capabilities.

## 🚀 Features

- **In-Browser Execution**: Runs entirely in the browser using WebAssembly
- **Multi-threaded Processing**: Utilizes Web Workers for improved performance
- **Tool Calling**: Supports function calling capabilities
- **Code Suggestions**: Provides intelligent code completions for HTML, CSS, and JavaScript
- **No Server Required**: All processing happens client-side

## 📦 Prerequisites

- Modern web browser (Chrome, Firefox, Edge, or Safari)
- Node.js (for local development)
- Git (for cloning the repository)

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/llama-cpp-wasm-qwen3.git
   cd llama-cpp-wasm-qwen3
   ```

2. Install dependencies (for development):
   ```bash
   npm install -g http-server
   ```

3. Download the required WebAssembly assets:
   ```bash
   chmod +x scripts/download_llama_cpp_wasm_assets.sh
   ./scripts/download_llama_cpp_wasm_assets.sh
   ```

## 🏃‍♂️ Quick Start

1. Place your Qwen3 GGUF model in the models directory:
   ```bash
   mkdir -p qwen3-browser-demo/models
   # Copy your Qwen3-0.6B-UD-Q8_K_XL.gguf to qwen3-browser-demo/models/
   ```

2. Start a local web server:
   ```bash
   cd qwen3-browser-demo
   http-server -p 8080
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## 🧩 Project Structure

```
qwen3-browser-demo/
├── llama-mt/               # llama-cpp-wasm runtime files
│   ├── llama.js            # Main library interface
│   ├── main-worker.js      # Web Worker implementation
│   ├── actions.js          # Action definitions
│   ├── utility.js          # Helper functions
│   ├── main.js             # WASM module loader
│   └── main.wasm           # Compiled WebAssembly module
├── models/                 # Store your GGUF models here
│   └── model.bin           # Symlink to your actual model file
└── index.html              # Demo interface

scripts/
├── download_llama_cpp_wasm_assets.sh  # Asset downloader
└── example_prd.txt                    # Example project requirements
```

## 🤖 Usage

### Initialization

```javascript
import { LlamaCpp } from './llama-mt/llama.js';

// Initialize the model
const llama = new LlamaCpp(
  '/models/your-model.gguf',  // Path to GGUF model
  onModelLoaded,             // Callback when model is loaded
  onTokenGenerated,          // Callback for each generated token
  onGenerationComplete       // Callback when generation completes
);

function onModelLoaded() {
  console.log('Model loaded and ready');
}

function onTokenGenerated(token) {
  process.stdout.write(token);
}

function onGenerationComplete() {
  console.log('\nGeneration complete');
}
```

### Text Generation

```javascript
// Start text generation
llama.generate({
  prompt: 'Hello, world!',
  n_predict: 100,           // Number of tokens to generate
  temp: 0.7,                // Temperature (0-2, lower = more focused)
  top_k: 40,               // Top-k sampling
  top_p: 0.95,              // Nucleus sampling
  n_gpu_layers: 20          // Number of layers to offload to GPU
});

// Stop generation
llama.stop();
```

## 🛠️ Development

### Building from Source

If you need to modify the WebAssembly components:

1. Install Emscripten SDK:
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. Build the project:
   ```bash
   ./build-multi-thread.sh
   ```

### Adding Tool Calling

To implement tool calling functionality:

1. Define your tool specifications in `llama-mt/actions.js`
2. Update the worker message handler in `llama-mt/main-worker.js`
3. Implement tool execution logic in your main application

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [llama.cpp](https://github.com/ggerganov/llama.cpp) - C/C++ inference of LLaMA models
- [llama-cpp-wasm](https://github.com/tangledgroup/llama-cpp-wasm) - WebAssembly port of llama.cpp
- [Qwen](https://huggingface.co/Qwen) - The Qwen language models

## 📄 TODO

- [ ] Add more comprehensive error handling
- [ ] Implement streaming responses
- [ ] Add support for more model formats
- [ ] Improve documentation and examples
- [ ] Add CI/CD pipeline for automated testing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
