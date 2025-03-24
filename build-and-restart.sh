#!/bin/bash

# Exit on error
set -e

echo "Building AI pieces from repository..."
node tools/scripts/build-ai-pieces.js

echo "Restarting the application to load newly built pieces..."
# Kill any running server processes
pkill -f "node.*serve server-api" || true

# Start the server components again
npm run dev
