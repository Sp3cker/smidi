#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

pushd "$ROOT_DIR/www" >/dev/null
if [ ! -d node_modules ]; then
  npm install
fi
popd >/dev/null

# Start Neutralino in development mode.
# This will also run the Vite dev server as configured in neutralino.config.json
if command -v neu >/dev/null 2>&1; then
  neu run --  --window-enable-inspector
else
  npx -y @neutralinojs/neu run
fi


