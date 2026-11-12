#!/bin/bash
set -e

echo "Building Next.js application..."
cd "$(dirname "$0")"
npm run build

echo "Copying build output to handlers/www/react..."
rm -rf ../handlers/www/react
mkdir -p ../handlers/www/react
cp -r out/* ../handlers/www/react/

echo "Build complete! Files copied to handlers/www/react"

