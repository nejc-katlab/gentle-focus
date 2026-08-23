#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

zip -r -q dist/gentle-focus.zip \
  manifest.json \
  background gate content options popup stats shared data icons \
  -x '*/harness.html' -x '*/preview.html' -x '*.test.js' -x '*/.DS_Store'

echo "Built dist/gentle-focus.zip"
echo "Contents:"
unzip -l dist/gentle-focus.zip | awk 'NR>3 {print $4}' | sed '/^$/d'
