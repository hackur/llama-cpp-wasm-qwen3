#!/bin/bash

# Dev script for Qwen3 Browser Demo
# Usage: ./dev.sh [command]

set -e

PORT=8080
DIR="$(cd "$(dirname "$0")" && pwd)"

case "${1:-help}" in
  # Start the development server with COOP/COEP headers
  start|server)
    echo "Starting server at http://localhost:$PORT"
    node "$DIR/server.js"
    ;;

  # Kill any process using the port
  kill)
    echo "Killing processes on port $PORT..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || echo "No process running on port $PORT"
    ;;

  # Check if model exists
  model)
    if [ -f "$DIR/models/Qwen3-0.6B-UD-Q8_K_XL.gguf" ]; then
      ls -lh "$DIR/models/Qwen3-0.6B-UD-Q8_K_XL.gguf"
    else
      echo "Model not found. Download from HuggingFace:"
      echo "https://huggingface.co/unsloth/Qwen3-0.6B-GGUF"
    fi
    ;;

  # Clean node_modules and reinstall
  clean)
    echo "Cleaning..."
    rm -rf "$DIR/node_modules"
    npm install --prefix "$DIR"
    ;;

  # Install dependencies
  install)
    npm install --prefix "$DIR"
    ;;

  help|*)
    echo "Qwen3 Browser Demo - Dev Commands"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start, server  - Start dev server with COOP/COEP headers"
    echo "  kill           - Kill process on port $PORT"
    echo "  model          - Check if model file exists"
    echo "  clean          - Remove node_modules and reinstall"
    echo "  install        - Install npm dependencies"
    echo "  help           - Show this help"
    ;;
esac
