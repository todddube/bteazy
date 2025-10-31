#!/bin/bash

# Build script for BTEazy extension
# Creates a distributable zip file for Chrome/Edge Web Store

set -e

echo ""
echo "Building BTEazy extension..."
echo ""

# Get version from manifest.json
VERSION=$(grep -oP '"version":\s*"\K[^"]+' manifest.json)

# Create dist directory if it doesn't exist
mkdir -p dist

# Output filename
OUTPUT_FILE="dist/bteazy-v${VERSION}.zip"

# Remove old build if exists
rm -f "$OUTPUT_FILE"

# Files and directories to include
FILES=(
  "manifest.json"
  "background.js"
  "content.js"
  "content.css"
  "popup.html"
  "popup.js"
  "popup.css"
  "options.html"
  "options.js"
  "options.css"
  "icons/"
)

# Create zip file
echo "Creating zip file: $OUTPUT_FILE"
echo ""

for file in "${FILES[@]}"; do
  if [ -e "$file" ]; then
    echo "  + $file"
    zip -r -q "$OUTPUT_FILE" "$file"
  else
    echo "  ⚠ Warning: $file not found, skipping..."
  fi
done

# Get file size
SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo ""
echo "✓ Build complete!"
echo "  Version: $VERSION"
echo "  File: $OUTPUT_FILE"
echo "  Size: $SIZE"
echo ""
echo "Ready to upload to Chrome/Edge Web Store!"
echo ""
