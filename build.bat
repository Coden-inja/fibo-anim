@echo off
echo Building Fibonacci Spiral Application...
echo.

REM Check if raylib is installed
where raylib >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: raylib not found in PATH
    echo Please install raylib and add it to your PATH
    echo Download from: https://github.com/raysan5/raylib/releases
    echo.
)

REM Check if GCC is available
where gcc >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: GCC not found in PATH
    echo Please install MinGW-w64 or MSYS2
    echo.
    pause
    exit /b 1
)

REM Compile the application
echo Compiling spiral.c...
gcc -Wall -Wextra -std=c99 -O2 -o fibonacci_spiral.exe spiral.c -lraylib -lgdi32 -lwinmm -lm

if %errorlevel% neq 0 (
    echo.
    echo Build failed!
    echo Make sure raylib is properly installed and linked.
    echo.
    pause
    exit /b 1
)

echo.
echo Build successful!
echo Executable created: fibonacci_spiral.exe
echo.

REM Ask if user wants to run the application
fibonacci_spiral.exe

echo.
echo Done!
pause 