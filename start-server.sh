#!/bin/bash
# Start Backend Server Script
# This script starts the Express.js backend server on port 3001

echo "🚀 Starting Premium.LK Backend Server..."
echo "📍 Current directory: $(pwd)"
echo "🔌 Server will run on: http://localhost:3001"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the app.cjs file exists
if [ ! -f "src/app.cjs" ]; then
    echo "❌ Server file not found: src/app.cjs"
    echo "💡 Make sure you're running this from the project root directory"
    exit 1
fi

# Start the server
echo "⏳ Starting server..."
node src/app.cjs
