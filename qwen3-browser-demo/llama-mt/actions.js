/**
 * @file Defines action types for communication between the main thread and WebWorker.
 * These constants are used to coordinate the lifecycle of the WebAssembly module and model execution.
 * @module actions
 */

/**
 * Action types for message passing between main thread and WebWorker.
 * @readonly
 * @enum {number}
 * @property {number} LOAD - Request to load the WebAssembly module and initialize the model.
 * @property {number} INITIALIZED - Notification that the WebAssembly module is loaded and ready.
 * @property {number} RUN_MAIN - Command to start model inference with the given prompt and parameters.
 * @property {number} WRITE_RESULT - Notification containing a generated token or intermediate result.
 * @property {number} RUN_COMPLETED - Notification that model inference has completed.
 * @property {number} ERROR - Notification that an error occurred during processing.
 */
export const action = {
    /** Request to load the WebAssembly module and initialize the model */
    LOAD: 0,
    
    /** Notification that the WebAssembly module is loaded and ready */
    INITIALIZED: 1,
    
    /** Command to start model inference with the given prompt and parameters */
    RUN_MAIN: 2,
    
    /** Notification containing a generated token or intermediate result */
    WRITE_RESULT: 3,
    
    /** Notification that model inference has completed */
    RUN_COMPLETED: 4,
    
    /** Notification that an error occurred during processing */
    ERROR: 5
};

/**
 * Default model parameters used for text generation.
 * These values are used when no specific parameters are provided.
 * @type {Object}
 * @property {number} n_predict - Maximum number of tokens to generate.
 * @property {number} temp - Temperature for sampling (0.0 to 2.0, higher values make output more random).
 * @property {number} top_k - Top-k sampling (0 = disabled, uses all tokens).
 * @property {number} top_p - Nucleus sampling (0.0 to 1.0, 1.0 = disabled).
 * @property {number} n_gpu_layers - Number of layers to offload to GPU (if supported).
 * @property {number} batch_size - Batch size for processing.
 * @property {number} ctx_size - Context window size.
 */
export const defaultParams = {
    n_predict: 128,
    temp: 0.7,
    top_k: 40,
    top_p: 0.9,
    n_gpu_layers: 0,
    batch_size: 512,
    ctx_size: 2048
};

/**
 * Creates a standardized message object for inter-thread communication.
 * @param {number} type - The action type from the action enum.
 * @param {Object} [data={}] - Additional data to include in the message.
 * @returns {Object} A message object with event type and data.
 */
export function createMessage(type, data = {}) {
    return {
        event: type,
        ...data,
        timestamp: Date.now()
    };
}

/**
 * Validates that a message has the required properties.
 * @param {Object} message - The message to validate.
 * @returns {boolean} True if the message is valid, false otherwise.
 */
export function isValidMessage(message) {
    return message && typeof message === 'object' && 'event' in message;
}