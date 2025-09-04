@echo off
REM Start Backend Server Script for Windows
REM This script starts the Express.js backend server on port 3001

echo 🚀 Starting Premium.LK Backend Server...
echo 📍 Current directory: %CD%
echo 🔌 Server will run on: http://localhost:3001
echo.

REM Check if the app.cjs file exists
if not exist "src\app.cjs" (
    echo ❌ Server file not found: src\app.cjs
    echo 💡 Make sure you're running this from the project root directory
    pause
    exit /b 1
)

REM Start the server
echo ⏳ Starting server...
node src\app.cjs

pause
