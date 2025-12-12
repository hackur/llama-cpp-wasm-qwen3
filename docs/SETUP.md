# Setup Guide

This guide covers setting up both the browser demo and Chrome extension.

## Prerequisites

- Modern web browser (Chrome 116+ recommended for extension)
- Node.js 18+ (for local development server)
- Git

## Quick Start: Browser Demo

### 1. Clone the Repository

```bash
git clone https://github.com/anthropics/llama-cpp-wasm-qwen3.git
cd llama-cpp-wasm-qwen3
```

### 2. Download WASM Assets

```bash
chmod +x scripts/download_llama_cpp_wasm_assets.sh
./scripts/download_llama_cpp_wasm_assets.sh
```

This downloads the pre-compiled llama.cpp WASM files to `qwen3-browser-demo/llama-mt/`.

### 3. Download a Model

Download a GGUF model file. Recommended: Qwen3-0.6B for reasonable performance.

```bash
mkdir -p qwen3-browser-demo/models
cd qwen3-browser-demo/models

# Option 1: Direct download (if available)
wget https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/main/qwen3-0.6b-q8_0.gguf

# Option 2: Use Hugging Face CLI
huggingface-cli download Qwen/Qwen3-0.6B-GGUF qwen3-0.6b-q8_0.gguf --local-dir .
```

### 4. Start the Server

```bash
cd qwen3-browser-demo
npx http-server -p 8080 --cors -c-1
```

### 5. Open in Browser

Navigate to http://localhost:8080

Note: For multi-threaded WASM (better performance), you need COOP/COEP headers. Use:

```bash
npx http-server -p 8080 --cors -c-1 \
  --header "Cross-Origin-Opener-Policy: same-origin" \
  --header "Cross-Origin-Embedder-Policy: require-corp"
```

## Chrome Extension Setup

### 1. Prepare the Extension

Copy WASM files to the extension:

```bash
cp qwen3-browser-demo/llama-mt/main.js extension/js/lib/
cp qwen3-browser-demo/llama-mt/main.wasm extension/js/lib/
```

### 2. Add Model File

```bash
mkdir -p extension/models
cp qwen3-browser-demo/models/Qwen3-0.6B-UD-Q8_K_XL.gguf extension/models/
```

Or download directly to `extension/models/`.

### 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension/` directory
5. The extension icon should appear in your toolbar

### 4. First Run

1. Click the extension icon to open the popup
2. Click "Load Model" - this takes ~30-60 seconds
3. Once loaded, enter a prompt and click "Send"

## Troubleshooting

### Model Fails to Load

**Symptoms:** Status shows "error" after clicking Load Model

**Causes:**
- Model file not found in `extension/models/`
- Model filename doesn't match `MODEL_FILE_PATH` in `background.js`
- WASM files missing from `extension/js/lib/`

**Fix:**
1. Check the Console in Chrome DevTools (right-click popup → Inspect)
2. Verify all required files exist
3. Update `MODEL_FILE_PATH` in `background.js` if using a different model

### Extension Doesn't Appear

**Symptoms:** No icon in toolbar after loading

**Causes:**
- Manifest errors
- Missing required files

**Fix:**
1. Check for errors on the `chrome://extensions/` page
2. Look at the "Errors" button next to your extension
3. Verify `manifest.json` is valid JSON

### Slow Performance

**Symptoms:** Inference takes very long

**Causes:**
- Large model file
- Single-threaded execution

**Fix:**
1. Use a smaller quantized model (Q4_K_M instead of Q8)
2. Ensure SharedArrayBuffer is available (check console)
3. Close other resource-intensive tabs

### "Offscreen document already exists" Error

**Symptoms:** Error when loading model multiple times

**Cause:** Chrome keeps offscreen documents alive; extension tries to create duplicate

**Fix:** This should be handled automatically. If persists:
1. Disable and re-enable the extension
2. Or restart Chrome

## File Size Limits

Chrome extensions have a 2GB limit for individual files. If your model exceeds this:

1. Use a smaller quantization (Q4 instead of Q8)
2. Use a smaller model (0.6B instead of 1.5B)
3. Consider hosting the model externally and fetching at runtime

## Recommended Models

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| Qwen3-0.6B-Q4_K_M | ~350MB | Good | Fast |
| Qwen3-0.6B-Q8_0 | ~650MB | Better | Medium |
| Qwen3-1.5B-Q4_K_M | ~900MB | Best | Slow |

For browser use, Q4_K_M quantization offers the best speed/quality tradeoff.
