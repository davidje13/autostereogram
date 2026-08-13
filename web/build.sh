#!/bin/sh
set -e

BASE_DIR="$(cd "$(dirname "$0")/.."; pwd)";

echo "Cleaning build...";
rm -r "$BASE_DIR/build" 2>/dev/null || true;

echo "Copying static web files...";
mkdir -p "$BASE_DIR/build";
cp -r "$BASE_DIR/web/static" "$BASE_DIR/build/static";
cp "$BASE_DIR/web/config.json" "$BASE_DIR/build/config.json";
