# TaskMaster Plan: Qwen3 0.6B with llama-cpp-wasm for In-Browser Tool Calling & Code Suggestions

**ID:** 1
**Title:** Implement Qwen3 0.6B In-Browser with llama-cpp-wasm, Tool Calling, and Code Suggestions
**Description:** This master task outlines the complete project to configure and deploy the `Qwen3-0.6B-UD-Q8_K_XL.gguf` model using `llama-cpp-wasm` to run entirely within a Chrome web browser. The primary goals are to enable robust tool calling capabilities (function calling) and to provide accurate CSS, HTML, and JavaScript code suggestions. The final deliverable should be a working web-based example demonstrating these functionalities.
**Status:** pending
**Priority:** high
**Dependencies:** None
**User Model:** `/Users/sarda/.lmstudio/models/kolosal/qwen3-0.6b/Qwen3-0.6B-UD-Q8_K_XL.gguf`
**Target Repository:** https://github.com/tangledgroup/llama-cpp-wasm

---

## Subtasks:

### **ID:** 1.1
**Title:** Phase 1: Project Setup & `llama-cpp-wasm` Integration
**Description:** Covers initial environment setup, acquiring and configuring the `llama-cpp-wasm` library, and preparing the Qwen3 GGUF model.
**Status:** pending
**Priority:** high
**Dependencies:** None

    #### **ID:** 1.1.1
    **Title:** Environment Preparation
    **Description:** Set up the necessary development environment.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Install Git:** Ensure Git is installed on your system. (Ref: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
        - [ ] **Install Node.js and npm/yarn:** Required for `http-server` or other simple web servers. (Ref: https://nodejs.org/)
        - [ ] **(Optional) Install Emscripten SDK:** If planning to build `llama-cpp-wasm` from source. Follow instructions from https://emscripten.org/docs/getting_started/downloads.html. *Note: Pre-built versions might be available in the `llama-cpp-wasm` repository, which would simplify this step.*

    #### **ID:** 1.1.2
    **Title:** Acquire and Set Up `llama-cpp-wasm`
    **Description:** Clone the `llama-cpp-wasm` repository and perform initial setup.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Clone the repository:** `git clone https://github.com/tangledgroup/llama-cpp-wasm.git`
        - [ ] **Navigate to the project directory:** `cd llama-cpp-wasm`
        - [ ] **Review Build Instructions:** Check `README.md` or build files (`Makefile`, `CMakeLists.txt`, etc.) for specific build steps if using source. (Ref: https://github.com/tangledgroup/llama-cpp-wasm)
        - [ ] **Build `llama-cpp-wasm` (if necessary):** Follow repository build instructions. May involve `emmake make` or `cmake` with Emscripten. *Example (general llama.cpp, adapt for wasm): `git submodule update --init --recursive` then build.*
        - [ ] **Identify pre-built examples:** Look for an `examples` or `demo` directory. The `llama-cpp-wasm` repo has HTML/JS examples.

    #### **ID:** 1.1.3
    **Title:** Prepare Your Qwen3 Model
    **Description:** Make the Qwen3 GGUF model accessible to the project.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Locate your GGUF model:** Confirm path `/Users/sarda/.lmstudio/models/kolosal/qwen3-0.6b/Qwen3-0.6B-UD-Q8_K_XL.gguf`.
        - [ ] **Copy the model to the project:** Create a `models` directory within your `llama-cpp-wasm` working directory (or a specific example directory) and copy your `.gguf` file into it. (e.g., `mkdir -p examples/my-qwen-chat/models`; `cp /Users/sarda/.lmstudio/models/kolosal/qwen3-0.6b/Qwen3-0.6B-UD-Q8_K_XL.gguf examples/my-qwen-chat/models/`)

---

### **ID:** 1.2
**Title:** Phase 2: Basic Web Interface & Model Loading
**Description:** Develop a simple web page to host the LLM and implement the initial JavaScript logic for loading and running the model.
**Status:** pending
**Priority:** high
**Dependencies:** 1.1

    #### **ID:** 1.2.1
    **Title:** Create a Basic HTML Structure
    **Description:** Set up the foundational HTML page for the demo.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Set up a project folder:** If not using an existing example, create `qwen3-browser-demo`.
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
                <script src="app.js"></script>
            </body>
            </html>
            ```
        - [ ] **Create `style.css` (optional basic styling):**
            ```css
            body { font-family: sans-serif; margin: 20px; }
            textarea { width: 100%; margin-bottom: 10px; }
            pre { background-color: #f4f4f4; padding: 10px; border: 1px solid #ccc; min-height: 100px; }
            ```

    #### **ID:** 1.2.2
    **Title:** JavaScript Setup for `llama-cpp-wasm`
    **Description:** Integrate the `llama-cpp-wasm` JavaScript components and initialize the library.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Reference `llama-cpp-wasm` JavaScript files:** Copy necessary files (e.g., `llama.js`, `llama-worker.js`, `llama.wasm`, and/or their multi-threaded versions like `llama-mt.js`, `llama-worker-mt.js`, `llama-mt.wasm`) from `llama-cpp-wasm/dist` (or similar build output) to your demo folder.
        - [ ] **Create `app.js` and initialize `llama-cpp-wasm`:**
            ```javascript
            // app.js (Conceptual - Adapt from llama-cpp-wasm examples)
            const promptInput = document.getElementById('promptInput');
            const submitPrompt = document.getElementById('submitPrompt');
            const outputArea = document.getElementById('outputArea');
            let llamaInstance; // Or however the library exposes its main object
            let modelLoaded = false;

            async function initializeLlama() {
                try {
                    outputArea.textContent = "Initializing llama-cpp-wasm...";
                    // Actual initialization: Refer to llama-cpp-wasm examples.
                    // This will likely involve:
                    // 1. Importing the Llama class/object: e.g., import { Llama } from "./llama.js"; (if using ES modules)
                    // 2. Instantiating Llama: e.g., llamaInstance = new Llama({
                    //        model: 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf', // Path to your model
                    //        // Paths to wasm and worker scripts, e.g.:
                    //        // wasm: 'llama-mt.wasm', 
                    //        // worker: () => new Worker('./llama-worker-mt.js', { type: 'module' })
                    //    });
                    // 3. Awaiting model load/compilation if it's a separate step in the API.
                    //    Some libraries load the model during instantiation.
                    
                    // Example API from a llama.cpp wasm variant:
                    // const { Llama } = await import('./llama.js'); // Adjust path
                    // llamaInstance = new Llama({
                    //     model: 'models/Qwen3-0.6B-UD-Q8_K_XL.gguf',
                    //     // For multi-threaded:
                    //     // wasmPaths: {
                    //     //    'mt': 'llama-mt.wasm'
                    //     // },
                    //     // logger: console.log 
                    // });
                    // await llamaInstance.init(); // Or similar if explicit init is needed
                    
                    modelLoaded = true;
                    outputArea.textContent = "Model Qwen3-0.6B loaded successfully and ready for inference!";
                    console.log("Llama instance initialized and model loaded.");
                } catch (error) {
                    console.error("Error initializing Llama or loading model:", error);
                    outputArea.textContent = `Initialization Error: ${error.message}`;
                }
            }
            initializeLlama();
            submitPrompt.addEventListener('click', async () => { /* ... inference logic ... */ });
            ```
        - [ ] **Ensure correct paths:** Paths to `.wasm` files, worker scripts, and the `.gguf` model must be correct relative to `index.html` and server configuration.

    #### **ID:** 1.2.3
    **Title:** Implement Basic Model Loading and Inference
    **Description:** Load the Qwen3 model and run a simple inference test.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Implement model loading in `app.js` (as part of `initializeLlama` or a separate step if needed by the API).**
        - [ ] **Implement basic inference in `app.js` `submitPrompt` listener:**
            ```javascript
            // Inside submitPrompt.addEventListener('click', async () => {
            if (!modelLoaded || !llamaInstance) {
                outputArea.textContent = "Model not loaded yet or Llama instance not ready. Please wait.";
                return;
            }
            const userPrompt = promptInput.value;
            if (!userPrompt.trim()) {
                outputArea.textContent = "Please enter a prompt.";
                return;
            }
            outputArea.textContent = "Processing...";

            // Qwen3 Prompt Format (ChatML)
            const fullPrompt = `<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
${userPrompt}<|im_end|>
<|im_start|>assistant
`;
            
            try {
                // Refer to llama-cpp-wasm API for sending prompt and getting response.
                // Example (check tangledgroup/llama-cpp-wasm for exact API):
                // const { LlamaCompletion } = await import('./llama.js'); // If completion is separate
                // const completion = await llamaInstance.createCompletion({
                //    prompt: fullPrompt,
                //    n_predict: 128, // Max tokens to generate
                //    temp: 0.7,      // Recommended for Qwen3
                //    top_k: 20,      // Recommended
                //    top_p: 0.95,    // Recommended
                //    // other llama.cpp params like repeat_penalty, grammar
                // });
                // outputArea.textContent = completion.content; // Or completion.data.text, etc.
                
                // For streaming (preferable for UX):
                // let accumulatedResponse = "";
                // outputArea.textContent = ""; // Clear previous output for streaming
                // for await (const chunk of llamaInstance.stream(fullPrompt, { /* params */ })) {
                //    // chunk might be { content: "token" } or similar
                //    const token = chunk.content || chunk.token || ""; // Adapt to actual chunk structure
                //    accumulatedResponse += token;
                //    outputArea.textContent = accumulatedResponse; 
                // }
                // console.log("Full response:", accumulatedResponse);

                outputArea.textContent = "Conceptual inference call. Implement with actual llama-cpp-wasm API.";
            } catch (error) {
                console.error("Error during inference:", error);
                outputArea.textContent = `Inference Error: ${error.message}`;
            }
            // });
            ```
        - [ ] **Test with simple prompts:** "Who are you?", "Explain WebAssembly."
        - [ ] **Set up a simple HTTP server:**
            - Install `http-server`: `npm install -g http-server`
            - Run from project directory: `http-server -c-1 --cors`
            - Open in Chrome: `http://localhost:8080`

---

### **ID:** 1.3
**Title:** Phase 3: Implementing Tool Calling
**Description:** Enable the LLM to request execution of predefined JavaScript functions.
**Status:** pending
**Priority:** high
**Dependencies:** 1.2

    #### **ID:** 1.3.1
    **Title:** Define Tool Specifications (Client-Side JavaScript)
    **Description:** Implement the JavaScript functions that the LLM can call.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Identify simple tools:** e.g., `getCurrentTime()`, `performCalculation({expression: "2+2"})`.
        - [ ] **Implement tools in `app.js`:**
            ```javascript
            // app.js
            const tools = {
                getCurrentTime: () => {
                    return JSON.stringify({ time: new Date().toLocaleTimeString() });
                },
                performCalculation: (args) => {
                    try {
                        // WARNING: eval is dangerous. For a PoC. Use a math parser library for production.
                        const result = eval(args.expression); 
                        return JSON.stringify({ result: result });
                    } catch (e) {
                        return JSON.stringify({ error: "Invalid expression for calculation.", details: e.message });
                    }
                }
            };

            function executeTool(toolName, toolArgsJson) {
                if (tools[toolName]) {
                    try {
                        const args = JSON.parse(toolArgsJson);
                        console.log(`Executing tool: ${toolName} with args:`, args);
                        const result = tools[toolName](args);
                        console.log(`Tool ${toolName} result:`, result);
                        return result;
                    } catch (e) {
                        const errorMsg = `Error parsing arguments for ${toolName} or executing tool: ${e.message}. Args received: ${toolArgsJson}`;
                        console.error(errorMsg);
                        return JSON.stringify({ error: errorMsg });
                    }
                }
                const errorMsg = `Tool ${toolName} not found.`;
                console.error(errorMsg);
                return JSON.stringify({ error: errorMsg });
            }
            ```

    #### **ID:** 1.3.2
    **Title:** Develop Prompt Strategy for Qwen3 Tool Use
    **Description:** Craft system prompts to guide Qwen3 in using tools.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **System Prompt for Tool Use:** Instruct Qwen3 on available tools, argument formats, and how to signal a tool call.
            *   Reference Qwen documentation and `unsloth/Qwen3-0.6B-GGUF` model card regarding agentic capabilities (`/think`, `Qwen-Agent`).
            *   The prompt must clearly define how the model should format its request (e.g., a specific JSON structure).
        - [ ] **Example System Prompt for Tool Calling (ChatML based):**
            ```
            <|im_start|>system
            You are a helpful assistant. You have access to the following tools.
            When you decide to use a tool, you MUST first use the '/think' command to explain your reasoning.
            Then, on a NEW LINE, provide the tool call as a single, valid JSON object with "tool_name" and "arguments" keys.
            Do NOT add any other text before or after the JSON object on that line.

            Available tools:
            1. getCurrentTime:
               - Description: Gets the current local time.
               - Arguments: {}
            2. performCalculation:
               - Description: Evaluates a mathematical expression.
               - Arguments: {"expression": "string for a mathematical expression (e.g., '2+2*5')"}
            
            Example of tool call:
            /think
            The user is asking for the current time. I should use the getCurrentTime tool.
            {"tool_name": "getCurrentTime", "arguments": {}}
            
            If you do not need to use a tool, answer the user's question directly.
            After I execute the tool, I will provide you with the result in the format:
            <|im_start|>tool_result
            Tool Result for [tool_name]: [JSON_result]
            <|im_end|>
            You should then use this result to formulate your final answer to the user.
            <|im_end|>
            ```
        - [ ] **Update `app.js` inference logic to prepend this system prompt to the user's first prompt in a tool-calling sequence.**

    #### **ID:** 1.3.3
    **Title:** Implement Tool Call Parsing and Execution Loop
    **Description:** Parse model output for tool calls, execute them, and feed results back.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **In `app.js`, create `parseAndExecuteTools(responseText, originalUserPrompt, conversationHistory)` function:**
            ```javascript
            // async function parseAndExecuteTools(responseText, originalUserPrompt, conversationHistory) {
            // Check for /think block and JSON tool call
            const thinkRegex = /\/think\s*([\s\S]*?)^(\{[\s\S]*\})$/m; // m for multiline $ to match end of line
            const match = responseText.match(thinkRegex);
            let toolCallJsonString;
            let thoughts = "";

            if (match && match[2]) {
                thoughts = match[1].trim();
                toolCallJsonString = match[2].trim();
                outputArea.textContent += `\n[LLM Thought]: ${thoughts}`;
                console.log("[LLM Thought]:", thoughts);
            } else {
                // Fallback: try to find any JSON that looks like our tool call format
                // This is less reliable; the model should strictly follow the /think -> JSON format.
                const jsonRegex = /^(\{[\s\S]*\})$/m;
                const jsonMatch = responseText.match(jsonRegex);
                if (jsonMatch && jsonMatch[1]) {
                    try {
                        const parsed = JSON.parse(jsonMatch[1]);
                        if (parsed.tool_name && parsed.arguments !== undefined) {
                            toolCallJsonString = jsonMatch[1];
                            outputArea.textContent += `\n[LLM Tool Call Attempt (no /think)]`;
                        }
                    } catch(e) { /* not valid JSON or not our format */ }
                }
            }

            if (toolCallJsonString) {
                outputArea.textContent += `\n[Tool Call JSON]: ${toolCallJsonString}`;
                console.log("[Tool Call JSON]:", toolCallJsonString);
                try {
                    const toolCall = JSON.parse(toolCallJsonString);
                    const toolResultJson = executeTool(toolCall.tool_name, JSON.stringify(toolCall.arguments));
                    outputArea.textContent += `\n[Tool Result - ${toolCall.tool_name}]: ${toolResultJson}`;
                    console.log(`[Tool Result - ${toolCall.tool_name}]:`, toolResultJson);

                    // Construct new history and prompt to feed back to model
                    // conversationHistory.push({ role: "assistant", content: responseText }); // Model's turn with tool call
                    // conversationHistory.push({ role: "tool_result", content: `Tool Result for ${toolCall.tool_name}: ${toolResultJson}`});
                    // const followUpSystemPrompt = "You are a helpful assistant. You previously decided to use a tool and I have provided the result. Now, provide the final answer to the user based on the tool's result and the conversation history.";
                    // const nextPromptForModel = formatPromptWithHistory(followUpSystemPrompt, conversationHistory, `Based on the tool result, formulate the final response.`);
                    
                    // For simplicity in this plan, let's assume a simplified follow-up:
                    const followUpPrompt = 
                        `${conversationHistoryToString(conversationHistory)}` + // Function to convert array of messages to string
                        `<|im_start|>assistant
${responseText}<|im_end|>
` + // Original model output with tool call
                        `<|im_start|>tool_result
Tool Result for ${toolCall.tool_name}: ${toolResultJson}<|im_end|>
` +
                        `<|im_start|>system
Now, provide the final answer to the user based on the tool's result.<|im_end|>
` +
                        `<|im_start|>user
Okay, what is the final answer to my original request: "${originalUserPrompt}"?<|im_end|>
`+
                        `<|im_start|>assistant
`;

                    // outputArea.textContent += "\nSending tool result back to model...";
                    // Call llamaInstance.createCompletion or .stream again with followUpPrompt
                    // const finalResponse = await llamaInstance.createCompletion({ prompt: followUpPrompt, ...params });
                    // outputArea.textContent = finalResponse.content; // Or stream it
                    console.log("Need to send this follow-up prompt to model:", followUpPrompt);
                    outputArea.textContent += `\n[Next Step]: Send follow-up prompt to model with tool result (see console). (Actual resubmission TBD)`;
                    return true; // Indicates a tool was called
                } catch (e) {
                    outputArea.textContent += `\n[Error Processing Tool Call or Result]: ${e.message}`;
                    console.error("Error processing tool call or result:", e);
                }
            }
            return false; // No tool call, or error
            // } // end of parseAndExecuteTools

            // In main inference logic:
            // const initialResponseText = ... // get from model
            // outputArea.textContent = initialResponseText;
            // const toolWasCalled = await parseAndExecuteTools(initialResponseText, userPrompt, currentConversationHistory);
            // if (!toolWasCalled) { /* Model responded directly */ }
            ```
        - [ ] **Test with tool-requiring prompts:** "What time is it?", "Calculate 25 * 4."
        - [ ] **Refine `conversationHistoryToString` and the follow-up logic.**

---

### **ID:** 1.4
**Title:** Phase 4: Implementing Code Suggestions
**Description:** Enable the LLM to generate HTML, CSS, and JavaScript code snippets.
**Status:** pending
**Priority:** high
**Dependencies:** 1.2

    #### **ID:** 1.4.1
    **Title:** Develop Prompt Strategy for Code Suggestions
    **Description:** Create system prompts to guide Qwen3 for code generation.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **System Prompt for Code Generation (ChatML):**
            ```
            <|im_start|>system
            You are an expert AI assistant specializing in generating HTML, CSS, and JavaScript code snippets.
            When asked for code, provide clean, well-formatted, and functional code.
            Specify the language in a markdown code block. For example:
            ```html
            <div>Hello</div>
            ```
            Provide only the code block as the answer if the request is solely for code.
            If the request involves explanation, provide it outside the code block.
            <|im_end|>
            ```
        - [ ] **User prompt examples:** "Generate HTML for a login form", "CSS for a blue button", "JavaScript to validate email".

    #### **ID:** 1.4.2
    **Title:** Integrate Code Suggestion into Web Interface
    **Description:** Update `app.js` to handle code prompts and display formatted code.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Update `app.js` inference logic:** Use the code generation system prompt when appropriate (e.g., if user prompt contains keywords like "generate code", "write html/css/js").
        - [ ] **Display generated code:** Ensure `outputArea` correctly renders markdown code blocks.
        - [ ] **(Optional) Add syntax highlighting:** Use a library like Prism.js or Highlight.js.
            - Include library: `<link href="prism.css" rel="stylesheet" /><script src="prism.js"></script>`
            - Wrap output: `<pre><code class="language-javascript">...</code></pre>` and call `Prism.highlightAll()`. Parse language from model's markdown.

---

### **ID:** 1.5
**Title:** Phase 5: Testing, Refinement & Deployment
**Description:** Thoroughly test all functionalities, refine prompts, and ensure browser compatibility.
**Status:** pending
**Priority:** high
**Dependencies:** 1.3, 1.4

    #### **ID:** 1.5.1
    **Title:** End-to-End Testing
    **Description:** Test all features comprehensively.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Test basic conversation.**
        - [ ] **Test tool calling:** `getCurrentTime`, `performCalculation` (valid/invalid expressions).
        - [ ] **Test code suggestions:** HTML, CSS, JavaScript snippets.
        - [ ] **Test edge cases:** Empty prompts, very long prompts (check context limits).

    #### **ID:** 1.5.2
    **Title:** Browser Compatibility & Performance
    **Description:** Ensure smooth operation in Chrome and monitor performance.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Confirm smooth running in latest Chrome.**
        - [ ] **Check Developer Console for errors/warnings.**
        - [ ] **Monitor memory usage.** Use multi-threaded `llama-cpp-wasm` if beneficial (`llama-mt.wasm`, `llama-worker-mt.js`).

    #### **ID:** 1.5.3
    **Title:** Refine Prompts and Logic
    **Description:** Iteratively improve prompts and tool parsing based on observations.
    **Status:** pending
    **Priority:** high
    **Details:**
        - [ ] **Iteratively improve system prompts** for tool calling and code generation.
        - [ ] **Make tool output parsing more robust.** Check official Qwen/`llama.cpp` docs for specific tool call output formats if `/think` proves insufficient. (e.g., `llama-server` uses `--reasoning-format deepseek`).
        - [ ] **Graceful error handling** at all stages.

    #### **ID:** 1.5.4
    **Title:** (Optional) Advanced Features
    **Description:** Consider and implement advanced functionalities if time permits.
    **Status:** pending
    **Priority:** medium
    **Details:**
        - [ ] **Streaming output:** Implement token streaming for better UX (likely shown in `llama-cpp-wasm` examples).
        - [ ] **Conversation history:** Implement and send conversation history for multi-turn interactions.
        - [ ] **More complex tools:** Define and implement more sophisticated tools.

---
**Final Confirmation Task (ID: 1.6):**
**Title:** Verify Working Sample
**Description:** Confirm that a working sample can load in a browser and perform inference, demonstrating successful tool calling and a code suggestion, fulfilling the project's core requirements.
**Status:** pending
**Priority:** high
**Dependencies:** 1.5
---

This detailed checklist should provide a clear path. Remember to consult the `llama-cpp-wasm` repository's documentation and examples frequently, as the exact API calls and setup will be dictated by that library. Good luck!