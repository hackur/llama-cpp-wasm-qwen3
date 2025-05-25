#!/bin/bash
#
# download_llama_cpp_wasm_assets.sh
#
# Description:
#   This script downloads the necessary WebAssembly assets for running llama-cpp-wasm
#   in a web browser. It handles downloading the required JavaScript and WebAssembly
#   files needed for multi-threaded execution.
#
# Usage:
#   ./download_llama_cpp_wasm_assets.sh
#
# Dependencies:
#   - curl: For downloading files
#   - mkdir: For creating directories
#   - chmod: For setting file permissions
#
# Exit Codes:
#   0: Success
#   1: Missing dependencies
#   2: Directory creation failed
#   3: File download failed
#
# Author: Your Name <your.email@example.com>
# Created: $(date +'%Y-%m-%d')


set -e  # Exit immediately if a command exits with a non-zero status

# Print usage information
print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help      Show this help message and exit"
    echo "  -v, --verbose   Enable verbose output"
    echo "  -d, --dir DIR   Set the target directory (default: qwen3-browser-demo/llama-mt)"
}

# Parse command line arguments
TARGET_DIR_FROM_PROJECT_ROOT="qwen3-browser-demo/llama-mt"
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--dir)
            TARGET_DIR_FROM_PROJECT_ROOT="$2"
            shift 2
            ;;
        *)
            echo "Error: Unknown option $1" >&2
            print_usage >&2
            exit 1
            ;;
    esac
done

# Check for required dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo "Error: Missing required dependencies: ${missing_deps[*]}" >&2
        exit 1
    fi
}

# Print verbose message if enabled
log() {
    if [ "$VERBOSE" = true ]; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    fi
}

# Main execution starts here
log "Starting asset download process..."

# Check for required dependencies
log "Checking for required dependencies..."
check_dependencies

# Get the absolute path of the directory where the script resides
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# Base URL where the pre-built assets are hosted
# This points to the multi-threaded version of llama-cpp-wasm
BASE_URL="https://tangledgroup.github.io/llama-cpp-wasm/llama-mt"

# Target directory relative to the project root (which is one level up from SCRIPT_DIR)
TARGET_DIR_ABSOLUTE="${SCRIPT_DIR}/../${TARGET_DIR_FROM_PROJECT_ROOT}"

# Files to download - these are required for the multi-threaded version
FILES=(
  "llama.js"        # Main library interface
  "main-worker.js"   # Web Worker implementation
  "actions.js"       # Action definitions and constants
  "utility.js"       # Utility functions
  "main.js"          # WASM module loader
  "main.wasm"        # Compiled WebAssembly module
)

# Ensure the target directory exists
log "Ensuring target directory exists: ${TARGET_DIR_ABSOLUTE}"
mkdir -p "${TARGET_DIR_ABSOLUTE}" || {
    echo "Error: Failed to create target directory: ${TARGET_DIR_ABSOLUTE}" >&2
    exit 2
}

echo "Downloading llama-cpp-wasm assets to: ${TARGET_DIR_ABSOLUTE}"

# Initialize counters
SUCCESS_COUNT=0
FAIL_COUNT=0

# Download each file
for file in "${FILES[@]}"; do
    FILE_URL="${BASE_URL}/${file}"
    OUTPUT_FILE="${TARGET_DIR_ABSOLUTE}/${file}"
    
    echo "[${SUCCESS_COUNT}+${FAIL_COUNT}/${#FILES[@]}] Downloading ${file}..."
    
    # Create a temporary file for downloading
    TEMP_FILE="${OUTPUT_FILE}.tmp"
    
    # Use curl to download with progress meter
    CURL_OPTS=(-L -f -o "${TEMP_FILE}")
    
    if [ "$VERBOSE" = true ]; then
        CURL_OPTS+=(--progress-bar)
    else
        CURL_OPTS+=(-s -S --show-error)
    fi
    
    if curl "${CURL_OPTS[@]}" "${FILE_URL}"; then
        # Move the temporary file to the final location
        mv "${TEMP_FILE}" "${OUTPUT_FILE}"
        log "  → Successfully downloaded to ${OUTPUT_FILE}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        # Clean up temporary file if download failed
        if [ -f "${TEMP_FILE}" ]; then
            rm -f "${TEMP_FILE}"
        fi
        echo "  → Failed to download ${file}" >&2
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

# Print summary
echo "\nDownload Summary:"
echo "  Successfully downloaded: ${SUCCESS_COUNT} files"

if [ ${FAIL_COUNT} -ne 0 ]; then
    echo "  Failed to download: ${FAIL_COUNT} files" >&2
    exit 3
fi

echo "\nAll assets have been downloaded successfully to ${TARGET_DIR_ABSOLUTE}/"
echo "\nNext steps:"
echo "1. Place your Qwen3 GGUF model in the models/ directory"
echo "2. Start a local web server (e.g., 'http-server -p 8080' in the qwen3-browser-demo directory)"
echo "3. Open http://localhost:8080 in your browser"

exit 0
echo "--- Download Summary ---"
echo "Successfully downloaded: ${SUCCESS_COUNT} file(s)"
echo "Failed to download:    ${FAIL_COUNT} file(s)"

echo "Listing contents of target directory after downloads:"
ls -la "${TARGET_DIR_ABSOLUTE}"
echo "----"

if [ "${FAIL_COUNT}" -gt 0 ]; then
  echo "Please check the URLs and your internet connection."
  echo "Expected files might be at a different path on ${BASE_URL} or the build page structure might have changed."
  echo "The base download URL used was: ${BASE_URL}/"
  exit 1
else
  echo "All expected assets downloaded successfully to ${TARGET_DIR_FROM_PROJECT_ROOT} (inside project root)."
  echo "You may now proceed with integrating them into your project."
fi

exit 0 