/**
 * @file Main interface for interacting with the llama-cpp-wasm WebWorker.
 * This class provides a high-level API for loading and running the Qwen3 model in a web browser.
 * @module LlamaCpp
 */

import { action } from "./actions.js";

/**
 * Main class for interacting with the llama-cpp-wasm WebWorker.
 * Handles communication with the WebWorker and provides a simple API for model interaction.
 */
class LlamaCpp {
    /**
     * Creates a new LlamaCpp instance.
     * @param {string} url - URL to the GGUF model file.
     * @param {Function} [init_callback] - Callback called when the model is loaded and ready.
     * @param {Function} [write_result_callback] - Callback for each generated token.
     * @param {Function} [on_complete_callback] - Callback when generation completes.
     * @throws {Error} If required callbacks are not provided.
     */
    constructor(url, init_callback, write_result_callback, on_complete_callback) {
        if (!url) {
            throw new Error('Model URL is required');
        }
        
        /** @private */
        this.url = url;
        
        /** @private */
        this.init_callback = init_callback || (() => {});
        
        /** @private */
        this.write_result_callback = write_result_callback || (() => {});
        
        /** @private */
        this.on_complete_callback = on_complete_callback || (() => {});
        
        /** @private */
        this.worker = null;
        
        this.loadWorker();
    }
    
    /**
     * Initializes the WebWorker and sets up message handlers.
     * @private
     */
    loadWorker() {
        try {
            this.worker = new Worker(
                new URL("./main-worker.js", import.meta.url),
                { type: "module" }
            );
            
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
            this.worker.onerror = this.handleWorkerError.bind(this);
            
            console.log('WebWorker initialized successfully');
        } catch (error) {
            console.error('Failed to initialize WebWorker:', error);
            throw new Error(`WebWorker initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Handles messages received from the WebWorker.
     * @param {MessageEvent} event - The message event from the worker.
     * @private
     */
    handleWorkerMessage(event) {
        if (!event.data || typeof event.data !== 'object') {
            console.warn('Received invalid message from worker:', event.data);
            return;
        }
        
        switch (event.data.event) {
            case action.INITIALIZED:
                console.log('Model initialized');
                this.init_callback();
                break;
                
            case action.WRITE_RESULT:
                this.write_result_callback(event.data.text || '');
                break;
                
            case action.RUN_COMPLETED:
                console.log('Generation completed');
                this.on_complete_callback();
                break;
                
            case action.ERROR:
                console.error('Worker reported error:', event.data.error);
                break;
                
            default:
                console.warn('Unhandled worker event:', event.data);
        }
    }
    
    /**
     * Handles errors from the WebWorker.
     * @param {ErrorEvent} error - The error event from the worker.
     * @private
     */
    handleWorkerError(error) {
        const errorMsg = `Worker error: ${error.message}`;
        console.error(errorMsg, error);
        throw new Error(errorMsg);
    }

    /**
     * Loads the model in the WebWorker.
     * @returns {Promise<void>} A promise that resolves when the model is loaded.
     */
    load() {
        return new Promise((resolve, reject) => {
            const onInit = () => {
                this.init_callback = () => {}; // Reset to avoid duplicate calls
                resolve();
            };
            
            const originalInit = this.init_callback;
            this.init_callback = () => {
                originalInit();
                onInit();
            };
            
            this.worker.postMessage({
                event: action.LOAD,
                model_path: this.url
            });
            
            // Set a timeout for model loading
            setTimeout(() => {
                reject(new Error('Model loading timed out'));
            }, 30000); // 30 second timeout
        });
    }

    /**
     * Generates text using the loaded model.
     * @param {Object} params - Generation parameters.
     * @param {string} params.prompt - The input prompt for generation.
     * @param {number} [params.n_predict=128] - Maximum number of tokens to generate.
     * @param {number} [params.temp=0.7] - Temperature for sampling.
     * @param {number} [params.top_k=40] - Top-k sampling parameter.
     * @param {number} [params.top_p=0.9] - Nucleus sampling parameter.
     * @param {number} [params.n_gpu_layers=0] - Number of layers to offload to GPU.
     * @returns {Promise<string>} The generated text.
     */
    generate(params) {
        return new Promise((resolve, reject) => {
            if (!params || typeof params !== 'object') {
                reject(new Error('Invalid parameters'));
                return;
            }
            
            let generatedText = '';
            const originalWrite = this.write_result_callback;
            const originalComplete = this.on_complete_callback;
            
            this.write_result_callback = (text) => {
                generatedText += text;
                originalWrite(text);
            };
            
            this.on_complete_callback = () => {
                this.write_result_callback = originalWrite;
                this.on_complete_callback = originalComplete;
                originalComplete();
                resolve(generatedText);
            };
            
            this.worker.postMessage({
                event: action.RUN_MAIN,
                ...params
            });
            
            // Set a timeout for generation
            setTimeout(() => {
                this.terminate();
                reject(new Error('Generation timed out'));
            }, 300000); // 5 minute timeout
        });
    }

    /**
     * Stops the current generation.
     * Note: This requires corresponding support in the WebWorker.
     */
    stop() {
        console.log('Generation stop requested');
        // Implementation would require adding a STOP action to the worker
        // this.worker.postMessage({ event: action.STOP });
    }

    /**
     * Terminates the WebWorker, freeing up resources.
     * After calling this, the instance cannot be used anymore.
     */
    terminate() {
        if (this.worker) {
            console.log('Terminating WebWorker');
            this.worker.terminate();
            this.worker = null;
        }
    }

    /**
     * Runs the model with the given parameters.
     * @param {Object} params - Model parameters.
     * @param {string} params.prompt - The input prompt for the model.
     * @param {boolean} [params.chatml=false] - Whether to use chatml format.
     * @param {number} [params.n_predict=-2] - Maximum number of tokens to generate.
     * @param {number} [params.ctx_size=2048] - Context size for the model.
     * @param {number} [params.batch_size=512] - Batch size for the model.
     * @param {number} [params.temp=0.8] - Temperature for sampling.
     * @param {number} [params.n_gpu_layers=0] - Number of layers to offload to GPU.
     * @param {number} [params.top_k=40] - Top-k sampling parameter.
     * @param {number} [params.top_p=0.9] - Nucleus sampling parameter.
     * @param {boolean} [params.no_display_prompt=true] - Whether to display the prompt.
     */
    run({
        prompt,
        chatml=false,
        n_predict=-2,
        ctx_size=2048,
        batch_size=512,
        temp=0.8,
        n_gpu_layers=0,
        top_k=40,
        top_p=0.9,
        no_display_prompt=true,
    }={}) {
        this.worker.postMessage({
            event: action.RUN_MAIN,
            prompt,
            chatml,
            n_predict,
            ctx_size,
            batch_size,
            temp,
            n_gpu_layers,
            top_k,
            top_p,
            no_display_prompt,
        });
    }
}

export { LlamaCpp };