#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

pushd "$ROOT_DIR/www" >/dev/null
npm install
npm run build
popd >/dev/null

# Build Neutralino binaries (for distribution)
if command -v neu >/dev/null 2>&1; then
  neu build
else
  npx -y @neutralinojs/neu build
fi

# Alternatively, to run the built app locally without packaging binaries:
# neu run --release


