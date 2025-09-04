@echo off
echo Starting the Premium.LK POS System...

echo 1. Setting up the database...
call npm run setup-db

echo 2. Starting the server...
start cmd /k "npm run server"

echo 3. Starting the application...
call npm run dev

echo All components have been started!
echo - Server is running at http://localhost:3001
echo - Frontend is running at http://localhost:5173
