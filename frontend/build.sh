#!/bin/bash

echo "Building React frontend..."
echo "NODE_ENV: $NODE_ENV"
echo "REACT_APP_API_URL: $REACT_APP_API_URL"

# Install dependencies
npm install

# Build the React app
npm run build

echo "Build complete!"
