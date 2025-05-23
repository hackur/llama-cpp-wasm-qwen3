# Detailed Plan: Qwen3 0.6B with llama-cpp-wasm for In-Browser Tool Calling & Code Suggestions

This plan outlines the steps to configure `llama-cpp-wasm` to run the `Qwen3-0.6B-UD-Q8_K_XL.gguf` model in a Chrome browser, enabling basic tool calling and CSS/HTML/JavaScript code suggestions.

**User Model:** `/Users/sarda/.lmstudio/models/kolosal/qwen3-0.6b/Qwen3-0.6B-UD-Q8_K_XL.gguf`
**Target Repository:** https://github.com/tangledgroup/llama-cpp-wasm

---

## Phase 1: Project Setup & `llama-cpp-wasm` Integration

### 1.1: Environment Preparation
    - [ ] **Install Git:** Ensure Git is installed on your system. (https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
    - [ ] **Install Node.js and npm/yarn:** Required for `http-server` or other simple web servers. (https://nodejs.org/)
    - [ ] **(Optional) Install Emscripten SDK:** If you plan to build `llama-cpp-wasm` from source. Follow instructions from https://emscripten.org/docs/getting_started/downloads.html.
        - *Note: Pre-built versions might be available in the `llama-cpp-wasm` repository, which would simplify this step.*

### 1.2: Acquire and Set Up `llama-cpp-wasm`
    - [ ] **Clone the repository:** `git clone https://github.com/tangledgroup/llama-cpp-wasm.git`
    - [ ] **Navigate to the project directory:** `cd llama-cpp-wasm`
    - [ ] **Review Build Instructions:** Check the `README.md` or build files (`Makefile`, `CMakeLists.txt`, etc.) for specific build steps if using source.
        - *Reference: https://github.com/tangledgroup/llama-cpp-wasm*
    - [ ] **Build `llama-cpp-wasm` (if necessary):**
        - [ ] Follow the build instructions from the repository. This might involve commands like `emmake make` or `cmake` with Emscripten.
        - *Example (from general llama.cpp, adapt for wasm): Might involve fetching submodules `git submodule update --init --recursive` then building.*
    - [ ] **Identify pre-built examples:** Look for an `examples` or `demo` directory. The `llama-cpp-wasm` repo has HTML/JS examples.

### 1.3: Prepare Your Qwen3 Model
    - [ ] **Locate your GGUF model:** Confirm path `/Users/sarda/.lmstudio/models/kolosal/qwen3-0.6b/Qwen3-0.6B-UD-Q8_K_XL.gguf`.
    - [ ] **Copy the model to the project:** Create a `models` directory within your `llama-cpp-wasm` working directory (or a specific example directory) and copy your `.gguf` file into it.
        - `mkdir -p examples/my-qwen-chat/models` (adjust path based on example structure)
        - `cp /Users/sarda/.lmstudio/models/kolosal/qwen3-0.6b/Qwen3-0.6B-UD-Q8_K_XL.gguf examples/my-qwen-chat/models/`

---

## Phase 2: Basic Web Interface & Model Loading

### 2.1: Create a Basic HTML Page
    - [ ] **Set up a project folder:** If not using an existing example, create a new folder (e.g., `qwen3-browser-demo`).
    - [ ] **Create `index.html`:**
        ```html
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Qwen3 0.6B In-Browser Demo</title>
            <link rel="stylesheet" href="style.css">
        </head>
        <body>
            <h1>Qwen3 0.6B In-Browser Demo</h1>
            <div>
                <textarea id="promptInput" rows="4" cols="50" placeholder="Enter your prompt..."></textarea>
                <button id="submitPrompt">Send</button>
            </div>
            <h2>Output:</h2>
            <pre id="outputArea"></pre>
            <script src="app.js"></script> <!-- Or directly include llama-cpp-wasm script -->
        </body>
        </html>
        ```
    - [ ] **Create `style.css` (optional basic styling):**
        ```css
        body { font-family: sans-serif; margin: 20px; }
        textarea { width: 100%; margin-bottom: 10px; }
        pre { background-color: #f4f4f4; padding: 10px; border: 1px solid #ccc; min-height: 100px; }
        ```

### 2.2: JavaScript for `llama-cpp-wasm`
    - [ ] **Reference `llama-cpp-wasm` JavaScript:**
        - The `llama-cpp-wasm` repository should provide a JavaScript file (e.g., `llama-ूंe.js` or similar, or instructions on how to use the Wasm module). Check their examples, particularly any HTML example.
        - You might need to copy `llama.js`, `llama-grammar.js`, `llama-worker.js`, `llama.wasm` (or their multi-threaded equivalents like `llama-mt.js`, `llama-worker-mt.js`, `llama-mt.wasm`) from the `llama-cpp-wasm/dist` or a similar build output directory to your demo folder.
    - [ ] **Create `app.js` (or integrate into `index.html`):**
        - **Initialize `llama-cpp-wasm`:**
            - Refer to `llama-cpp-wasm` documentation/examples on how to instantiate and initialize the LlamaCpp class. This usually involves pointing to the Wasm module and potentially worker scripts.
            - *Example structure (conceptual, refer to actual API):*
            ```javascript
            // app.js (Conceptual - Adapt from llama-cpp-wasm examples)
            // const LlamaCpp = require('llama-cpp'); // Or however it's exposed
            // const llama = new LlamaCpp(pathToWasm);

            const promptInput = document.getElementById('promptInput');
            const submitPrompt = document.getElementById('submitPrompt');
            const outputArea = document.getElementById('outputArea');

            // Placeholder for LlamaCpp instance and model loading
            let llamaInstance;
            let modelLoaded = false;

            async function initializeLlama() {
                try {
                    // Check llama-cpp-wasm examples for actual initialization
                    // e.g., using LlamaCpp.load or new Llama(...)
                    // This will involve specifying the path to the .wasm file and model.
                    outputArea.textContent = "Initializing llama-cpp-wasm...";
                    
                    // Example: Using the Llama class from an example like:
                    // https://github.com/tangledgroup/llama-cpp-wasm/blob/main/examples/index.html
                    const config = {
                        modelUrl: 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf', // Path to your model
                        // Ensure wasm files (e.g., llama.wasm, llama-mt.wasm) are served correctly
                        // And worker scripts (llama-worker.js, llama-worker-mt.js)
                        // Refer to the specific example you're adapting.
                        // It might be:
                        // wasmUrl: 'llama.wasm' or 'llama-mt.wasm'
                        // workerFactory: () => new Worker('./llama-worker.js', { type: 'module' })
                    };
                    
                    // The actual API will be specific to llama-cpp-wasm.
                    // Look for a load function or constructor.
                    // The library might expose a global Llama object or require an import.
                    // This is highly dependent on the library's structure.
                    // For instance, from their examples:
                    // It seems they use <script type="module"> and import { Llama } from "./llama.js";
                    // And then: const llama = new Llama({ model: 'model-url', ... });
                    
                    outputArea.textContent = "Llama loaded (conceptual). Model loading next...";
                    // Actual model loading will be part of the Llama class API.
                    // It might be implicit in the constructor or an explicit loadModel() method.
                    
                    modelLoaded = true; // Set this upon successful model load confirmation
                    outputArea.textContent = "Model Qwen3-0.6B loaded successfully!";
                } catch (error) {
                    console.error("Error initializing Llama or loading model:", error);
                    outputArea.textContent = `Error: ${error.message}`;
                }
            }
            
            initializeLlama(); // Call on page load

            submitPrompt.addEventListener('click', async () => {
                // ... (inference logic in next step)
            });
            ```
        - **Ensure correct paths:** Paths to `.wasm` files, worker scripts, and the `.gguf` model must be correct relative to your `index.html` and how the server serves them.

### 2.3: Load and Run the Model with a Simple Prompt
    - [ ] **Implement model loading in `app.js`:**
        - This typically involves specifying the URL of your `.gguf` model file.
        - Ensure the model is downloaded/fetched by the browser. Monitor browser developer tools (Network tab).
        - *Refer to `llama-cpp-wasm` examples for the exact API to load a model.*
    - [ ] **Implement basic inference in `app.js`:**
        ```javascript
        // Inside submitPrompt.addEventListener('click', async () => { ... });
        if (!modelLoaded) {
            outputArea.textContent = "Model not loaded yet. Please wait.";
            return;
        }
        const prompt = promptInput.value;
        if (!prompt.trim()) {
            outputArea.textContent = "Please enter a prompt.";
            return;
        }

        outputArea.textContent = "Processing...";

        try {
            // Qwen3 Prompt Format
            const fullPrompt = `<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
${prompt}<|im_end|>
<|im_start|>assistant
`;
            // Refer to llama-cpp-wasm API for sending prompt and getting response
            // This is a conceptual example:
            // const response = await llamaInstance.generate(fullPrompt, {
            //    max_tokens: 200, // Example parameter
            //    temperature: 0.7, // from Qwen3 research
            //    top_p: 0.9,       // from Qwen3 research
            //    // other parameters like top_k, repeat_penalty
            // });
            // outputArea.textContent = response.text; // Or however the result is structured

            // Example based on potential API of llama-cpp-wasm (CHECK THEIR DOCS!)
            // If using something like completion = await llama.createCompletion(...)
            // const completion = await llamaInstance.createCompletion({
            //     prompt: fullPrompt,
            //     n_predict: 128, // Max tokens
            //     temp: 0.7,
            //     // other llama.cpp params
            // });
            // outputArea.textContent = completion.content;
            
            // For streaming, the API would be different, likely involving callbacks.
            // e.g., llamaInstance.stream(fullPrompt, (token) => { outputArea.textContent += token; });

            outputArea.textContent = "Inference call (conceptual). Implement with actual API.";
            
            // Example usage seen in some llama.cpp WebAssembly wrappers:
            // const { llama } = globalThis?.exposedLlama; // Assuming it's exposed globally
            // if (llama) {
            //    const stream = llama.stream(fullPrompt, { /* params */ });
            //    let result = "";
            //    for await (const chunk of stream) {
            //        result += chunk.content;
            //        outputArea.textContent = result;
            //    }
            // } else {
            //    outputArea.textContent = "Llama instance not found.";
            // }


        } catch (error) {
            console.error("Error during inference:", error);
            outputArea.textContent = `Inference Error: ${error.message}`;
        }
        // });
        ```
    - [ ] **Test with a simple prompt:** E.g., "Who are you?" or "Capital of France?"
    - [ ] **Set up a simple HTTP server:**
        - Install `http-server`: `npm install -g http-server`
        - Run from your project directory (e.g., `qwen3-browser-demo` or `llama-cpp-wasm/examples/your-example`): `http-server -c-1 --cors` (disable caching, enable CORS)
        - Open in Chrome: `http://localhost:8080`

---

## Phase 3: Implementing Tool Calling

### 3.1: Define Tool Specifications (Client-Side JavaScript)
    - [ ] **Identify simple tools:** For example:
        - `getCurrentTime()`: Returns the current time.
        - `performCalculation(expression)`: Evaluates a simple math expression.
        - `getInformation(topic)`: (Simulated) Returns a predefined string for a topic.
    - [ ] **Implement these tools as JavaScript functions in `app.js`:**
        ```javascript
        // app.js
        const tools = {
            getCurrentTime: () => {
                return JSON.stringify({ time: new Date().toLocaleTimeString() });
            },
            performCalculation: (args) => { // Expects args like { expression: "2+2" }
                try {
                    // Sanitize and evaluate safely if using eval. Be cautious!
                    // For a real scenario, use a math parser library.
                    const result = eval(args.expression); 
                    return JSON.stringify({ result: result });
                } catch (e) {
                    return JSON.stringify({ error: "Invalid expression", details: e.message });
                }
            },
            // Example for code suggestion - might not be a "tool" but a prompt mode
            // getCodeSuggestion: (args) => { /* Covered in Phase 4 */ }
        };

        function executeTool(toolName, toolArgsJson) {
            if (tools[toolName]) {
                try {
                    const args = JSON.parse(toolArgsJson);
                    return tools[toolName](args);
                } catch (e) {
                    return JSON.stringify({ error: `Error parsing arguments for ${toolName} or executing tool. Ensure args are valid JSON.`, details: e.message });
                }
            }
            return JSON.stringify({ error: `Tool ${toolName} not found.` });
        }
        ```

### 3.2: Develop Prompt Strategy for Qwen3 Tool Use
    - [ ] **System Prompt for Tool Use:** Design a system prompt that instructs Qwen3 on how to use tools.
        - *Research indicates Qwen3 models respond to specific formats for agentic behavior. The `unsloth/Qwen3-0.6B-GGUF` model card mentions `/think` and `Qwen-Agent`.*
        - We need to craft a prompt that tells the model:
            1.  Available tools and their descriptions (and expected argument format - JSON).
            2.  How to format a tool call in its output (e.g., a specific JSON structure or a text pattern).
    - [ ] **Example System Prompt Structure:**
        ```
        <|im_start|>system
        You are a helpful assistant capable of using tools. When you need to use a tool, output your thoughts using '/think' and then specify the tool call in JSON format: {"tool_name": "tool_to_call", "arguments": {"arg1": "value1", ...}}.
        Available tools:
        - getCurrentTime: Get the current time. Arguments: {}
        - performCalculation: Perform a calculation. Arguments: {"expression": "mathematical expression string"}
        
        Respond to the user's request. If a tool is needed, provide the /think block and the JSON tool call. Otherwise, respond directly.
        After a tool call, I will provide the result, and you should use it to answer the user's original request.
        Example of tool call:
        /think
        The user is asking for the current time. I should use the getCurrentTime tool.
        <|im_end|>
        <|im_start|>tool_code
        {"tool_name": "getCurrentTime", "arguments": {}}
        <|im_end|>
        
        (Self-correction: The model might not use `<|im_start|>tool_code` itself. We might need to parse a specific JSON structure or keyword from the assistant's normal output. Let's assume for now it tries to output JSON directly or a specific structured string that we can parse.)

        Revised System Prompt for simpler parsing:
        You are a helpful assistant capable of using tools.
        When you decide to use a tool, first explain your thought process using the '/think' command.
        Then, on a new line, output the tool call as a single JSON object with "tool_name" and "arguments" keys. For example:
        {"tool_name": "getCurrentTime", "arguments": {}}

        Available tools:
        1. getCurrentTime:
           - Description: Gets the current time.
           - Arguments: {}
        2. performCalculation:
           - Description: Evaluates a mathematical expression.
           - Arguments: {"expression": "string representation of the math expression (e.g., '2+2*5')"}

        Only output the JSON for the tool call if you intend to use a tool. Otherwise, answer the user directly.
        If you use a tool, I will provide the result, and then you will use that result to formulate the final answer to the user.
        <|im_end|>
        ```
    - [ ] **Update `app.js` inference logic:** Incorporate this system prompt.
    - [ ] **Iterative Prompting Cycle:** Plan for a multi-turn conversation if a tool is called:
        1. User prompt -> Model (with system prompt)
        2. Model output -> Parse for tool call
        3. If tool call: Execute tool -> Get tool result
        4. New prompt to Model: (Original prompt + Tool call + Tool result) -> Model provides final answer.

### 3.3: Parse Model Output for Tool Calls
    - [ ] **In `app.js`, after getting model output:**
        ```javascript
        // Inside the inference function, after getting model's response string
        // let modelResponseText = completion.content; // or however it's received

        function parseAndExecuteTools(responseText, originalUserPrompt) {
            // Attempt to find the /think block and the JSON tool call
            const thinkMatch = responseText.match(/\/think\s*([\s\S]*?)\s*(\{[\s\S]*\})/);
            let toolCallJsonString;
            let thoughts = "";

            if (thinkMatch && thinkMatch[2]) {
                thoughts = thinkMatch[1].trim();
                toolCallJsonString = thinkMatch[2].trim();
                outputArea.textContent += `\n[Thought Process]: ${thoughts}`;
            } else {
                // Simpler parsing: look for a JSON object that looks like a tool call
                // This is less robust but can be a starting point.
                // A more robust way is to have the model output a specific keyword before the JSON.
                try {
                    // A common pattern is for the model to output JSON directly if it's a tool call.
                    // Or try to extract JSON from the response string.
                    const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
                    if (jsonMatch) {
                        const potentialJson = jsonMatch[0];
                        const parsed = JSON.parse(potentialJson);
                        if (parsed.tool_name && parsed.arguments !== undefined) {
                            toolCallJsonString = potentialJson;
                        }
                    }
                } catch (e) { /* Not a JSON object or not our expected format */ }
            }

            if (toolCallJsonString) {
                outputArea.textContent += `\n[Tool Call Detected]: ${toolCallJsonString}`;
                try {
                    const toolCall = JSON.parse(toolCallJsonString);
                    if (toolCall.tool_name && toolCall.arguments !== undefined) {
                        const toolResult = executeTool(toolCall.tool_name, JSON.stringify(toolCall.arguments));
                        outputArea.textContent += `\n[Tool Result - ${toolCall.tool_name}]: ${toolResult}`;
                        
                        // Now, feed this back to the model
                        const followUpPrompt = `
<|im_start|>system
You are a helpful assistant. You previously decided to use a tool.
User's original request: ${originalUserPrompt}
Your thought process: ${thoughts || 'N/A'}
Tool used: ${toolCall.tool_name}
Tool arguments: ${JSON.stringify(toolCall.arguments)}
Tool result: ${toolResult}
Now, provide the final answer to the user based on the tool's result.<|im_end|>
<|im_start|>user
Based on the tool's execution and result, please formulate the final response to my original request: "${originalUserPrompt}"<|im_end|>
<|im_start|>assistant
`;
                        // Call llamaInstance.generate/createCompletion again with followUpPrompt
                        // And update outputArea with the final response.
                        // This creates a loop, so manage it carefully.
                        // For now, just log it:
                        console.log("Need to send this follow-up prompt:", followUpPrompt);
                        outputArea.textContent += `\n[Next Step]: Send follow-up prompt to model with tool result.`;
                        // actualResubmitToModel(followUpPrompt); // Implement this function
                        return true; // Indicates a tool was called and processed
                    }
                } catch (e) {
                    outputArea.textContent += `\n[Error processing tool call]: ${e.message}`;
                }
            }
            return false; // No tool call, or error in processing
        }

        // In your main inference logic:
        // const modelResponseText = ... get response from model ...
        // outputArea.textContent = modelResponseText; // Show initial model response
        // const toolWasCalled = parseAndExecuteTools(modelResponseText, prompt);
        // if (!toolWasCalled) {
        //    // Model responded directly, no tool call
        // }
        ```
    - [ ] **Test with prompts requiring tools:** "What time is it?", "What is 5 plus 10?"

### 3.4: Execute Tools and Feed Results Back (Simplified Loop)
    - [ ] **Implement `actualResubmitToModel(followUpPrompt)` function:**
        - This function would be similar to the initial prompt submission logic but uses the `followUpPrompt`.
    - [ ] **Refine the loop:** Ensure the conversation flow is logical. The model should use the tool's output to answer the original user query.
        - Consider context length and how much history to keep sending.

---

## Phase 4: Implementing Code Suggestions

### 4.1: Develop Prompt Strategy for Code Suggestions
    - [ ] **System Prompt for Code Generation:**
        ```
        <|im_start|>system
        You are an expert AI assistant specializing in generating HTML, CSS, and JavaScript code snippets.
        When asked for code, provide clean, well-formatted, and functional code.
        Specify the language in a markdown code block.
        For example:
        ```html
        <div>Hello</div>
        ```
        <|im_end|>
        ```
    - [ ] **User Prompt Examples for Code:**
        - "Generate HTML for a login form with username and password fields and a submit button."
        - "Write CSS to style a button with a blue background and white text."
        - "Create a JavaScript function to validate an email address."
    - [ ] **No complex tool parsing needed here usually:** The model's output should directly be the code snippet.

### 4.2: Integrate into Web Interface
    - [ ] **Update `app.js` to handle code prompts:**
        - The existing inference logic can be used. The key is the system prompt and the user's query.
        - The `outputArea` will display the generated code.
    - [ ] **Consider using a library like Prism.js or Highlight.js for syntax highlighting of the output code on the HTML page.**
        - [ ] Add library: e.g., `<link href="prism.css" rel="stylesheet" /><script src="prism.js"></script>`
        - [ ] Wrap output in `<pre><code class="language-javascript">...</code></pre>` and call `Prism.highlightAll()`. The model should ideally output markdown like ```javascript ... ``` so you can parse the language.

---

## Phase 5: Testing, Refinement & Deployment

### 5.1: End-to-End Testing
    - [ ] **Test basic conversation:** Ensure the model responds coherently.
    - [ ] **Test tool calling:**
        - [ ] Tool: `getCurrentTime`
        - [ ] Tool: `performCalculation` (with valid and invalid expressions)
    - [ ] **Test code suggestions:**
        - [ ] HTML snippet
        - [ ] CSS snippet
        - [ ] JavaScript snippet
    - [ ] **Test edge cases:** Empty prompts, very long prompts (respecting context limits).

### 5.2: Browser Compatibility
    - [ ] **Confirm it runs smoothly in latest Chrome.**
    - [ ] **Check Developer Console for errors/warnings.**
    - [ ] **Monitor memory usage for large models / long contexts.** `llama-cpp-wasm` mentions multi-threading support which can improve performance. Ensure you are using the multi-threaded version if appropriate (`llama-mt.wasm`, `llama-worker-mt.js`).

### 5.3: Refine Prompts and Logic
    - [ ] **Iteratively improve system prompts** for tool calling and code generation based on observed model behavior.
    - [ ] **Improve tool output parsing:** Make it more robust. If Qwen3 has a very specific way to signal tool usage (beyond `/think` and JSON), adapt to that.
        - *Research Qwen-Agent or official Qwen documentation for specifics on structured output for tools if available.*
    - [ ] **Handle potential errors gracefully** at each step (model loading, inference, tool execution).

### 5.4: (Optional) Advanced Features
    - [ ] **Streaming output:** Modify `app.js` to handle token streaming from `llama-cpp-wasm` for a more responsive UI. (The `llama-cpp-wasm` examples likely show this).
    - [ ] **Conversation history:** Implement a mechanism to maintain and send conversation history with each prompt to allow for multi-turn conversations beyond a single tool call cycle.
    - [ ] **More complex tools:** Define and implement more sophisticated tools.

---

This detailed checklist should provide a clear path. Remember to consult the `llama-cpp-wasm` repository's documentation and examples frequently, as the exact API calls and setup will be dictated by that library. Good luck!