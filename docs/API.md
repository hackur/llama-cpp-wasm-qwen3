# API Reference

## LlamaCpp Class

The main interface for running llama.cpp models in the browser.

### Constructor

```javascript
new LlamaCpp(url, init_callback, write_result_callback, on_complete_callback, error_callback?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | URL or path to the GGUF model file |
| `init_callback` | `Function` | Called when model is loaded and ready |
| `write_result_callback` | `Function` | Called for each generated token chunk |
| `on_complete_callback` | `Function` | Called when generation finishes |
| `error_callback` | `Function` | Optional. Called on errors |

**Example:**

```javascript
import { LlamaCpp } from './llama-mt/llama.js';

const llm = new LlamaCpp(
  '/models/qwen3-0.6b.gguf',
  () => {
    console.log('Model ready!');
    document.getElementById('status').textContent = 'Ready';
  },
  (token) => {
    document.getElementById('output').textContent += token;
  },
  () => {
    console.log('Generation complete');
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

### run(options)

Starts text generation with the given prompt.

```javascript
llm.run(options)
```

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `prompt` | `string` | required | Input text for the model |
| `chatml` | `boolean` | `false` | Use ChatML template format |
| `n_predict` | `number` | `-2` | Max tokens to generate. -1 = unlimited, -2 = context size |
| `ctx_size` | `number` | `2048` | Context window size in tokens |
| `batch_size` | `number` | `512` | Batch size for prompt processing |
| `temp` | `number` | `0.8` | Sampling temperature. 0 = greedy, higher = more random |
| `n_gpu_layers` | `number` | `0` | GPU layers (unused in WASM) |
| `top_k` | `number` | `40` | Top-K sampling cutoff |
| `top_p` | `number` | `0.9` | Nucleus sampling probability threshold |
| `no_display_prompt` | `boolean` | `true` | Exclude prompt from output |

**Example:**

```javascript
llm.run({
  prompt: 'Write a short poem about coding:',
  n_predict: 100,
  temp: 0.7,
  top_p: 0.95
});
```

## Worker Actions

Constants for message passing between main thread and worker.

```javascript
import { action } from './llama-mt/actions.js';
```

| Action | Value | Direction | Description |
|--------|-------|-----------|-------------|
| `LOAD` | `0` | Main → Worker | Request to load model |
| `INITIALIZED` | `1` | Worker → Main | Model loaded successfully |
| `RUN_MAIN` | `2` | Main → Worker | Start inference |
| `WRITE_RESULT` | `3` | Worker → Main | Token chunk generated |
| `RUN_COMPLETED` | `4` | Worker → Main | Inference finished |
| `ERROR` | `5` | Worker → Main | Error occurred |

## Utility Functions

### loadBinaryResource(url, callback)

Loads a binary file with Cache API support.

```javascript
import { loadBinaryResource } from './llama-mt/utility.js';

loadBinaryResource('/models/model.gguf', (bytes) => {
  console.log(`Loaded ${bytes.length} bytes`);
});
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | URL to the binary resource |
| `callback` | `Function` | Called with `Uint8Array` of loaded bytes |

The function first checks the browser's Cache API for a previously downloaded copy. If not found, it downloads via XHR and caches for future use.

## Chrome Extension Messages

### Popup → Background

| Action | Payload | Description |
|--------|---------|-------------|
| `PING` | none | Health check |
| `LOAD_MODEL` | none | Request to load model |
| `SEND_PROMPT` | `{ prompt: string }` | Send prompt for inference |
| `CHECK_OFFSCREEN_STATUS` | none | Debug: check offscreen doc |

### Background → Popup

| Action | Payload | Description |
|--------|---------|-------------|
| `UPDATE_MODEL_STATUS` | `{ status, message }` | Model state changed |

### Background → Offscreen

| Action | Payload | Description |
|--------|---------|-------------|
| `OFFSCREEN_INIT_MODEL` | `{ modelUrl }` | Load model |
| `OFFSCREEN_RUN_PROMPT` | `{ prompt }` | Run inference |

### Offscreen → Background

| Action | Payload | Description |
|--------|---------|-------------|
| `OFFSCREEN_MODEL_LOADED` | none | Model ready |
| `OFFSCREEN_MODEL_RESPONSE` | `{ response }` | Inference result |
| `OFFSCREEN_MODEL_INIT_ERROR` | `{ error }` | Load failed |
| `OFFSCREEN_MODEL_RUN_ERROR` | `{ error }` | Inference failed |
| `OFFSCREEN_MODEL_NOT_LOADED_FOR_PROMPT` | none | Model not ready |
| `OFFSCREEN_ALREADY_INITIALIZING` | none | Load in progress |

## Type Definitions

```typescript
interface RunOptions {
  prompt: string;
  chatml?: boolean;
  n_predict?: number;
  ctx_size?: number;
  batch_size?: number;
  temp?: number;
  n_gpu_layers?: number;
  top_k?: number;
  top_p?: number;
  no_display_prompt?: boolean;
}

interface ModelStatus {
  status: 'not_loaded' | 'loading' | 'loaded' | 'error';
  message?: string;
}
```
