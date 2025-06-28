@echo off
echo Starting KarmaGo local server...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting Node.js HTTP server on port 8000...
    echo Open your browser to: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    node server.js
) else (
    echo Node.js not found. Trying Python...
    python --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Starting Python HTTP server on port 8000...
        echo Open your browser to: http://localhost:8000
        echo Press Ctrl+C to stop the server
        echo.
        python -m http.server 8000
    ) else (
        echo Python not found. Trying Python3...
        python3 --version >nul 2>&1
        if %errorlevel% == 0 (
            echo Starting Python3 HTTP server on port 8000...
            echo Open your browser to: http://localhost:8000
            echo Press Ctrl+C to stop the server
            echo.
            python3 -m http.server 8000
        ) else (
            echo No suitable server found.
            echo Please install one of the following:
            echo 1. Node.js from nodejs.org
            echo 2. Python from python.org
            echo 3. Use Live Server extension in VS Code
            pause
        )
    )
)