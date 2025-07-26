#!/bin/bash

echo "Building Fibonacci Spiral Application..."
echo

# Check if raylib is installed
if ! command -v pkg-config &> /dev/null || ! pkg-config --exists raylib; then
    echo "Warning: raylib not found"
    echo "Please install raylib using your package manager:"
    echo "  Ubuntu/Debian: sudo apt-get install libraylib-dev"
    echo "  macOS: brew install raylib"
    echo "  Or compile from source: https://github.com/raysan5/raylib"
    echo
fi

# Check if GCC is available
if ! command -v gcc &> /dev/null; then
    echo "Error: GCC not found"
    echo "Please install GCC using your package manager"
    echo
    exit 1
fi

# Compile the application
echo "Compiling spiral.c..."

# Platform-specific linking
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    gcc -Wall -Wextra -std=c99 -O2 -o fibonacci_spiral spiral.c -lraylib -lGL -lpthread -ldl -lrt -lX11 -lm
elif [[ "$OSTYPE" == "darwin"* ]]; then
    gcc -Wall -Wextra -std=c99 -O2 -o fibonacci_spiral spiral.c -lraylib -lm
else
    echo "Unsupported platform: $OSTYPE"
    echo "Please compile manually or use make"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo
    echo "Build failed!"
    echo "Make sure raylib is properly installed and linked."
    echo "Try using 'make' instead or check the README for manual compilation instructions."
    echo
    exit 1
fi

echo
echo "Build successful!"
echo "Executable created: fibonacci_spiral"
echo

# Ask if user wants to run the application
read -p "Do you want to run the application now? (y/n): " run
if [[ $run == "y" || $run == "Y" ]]; then
    echo
    echo "Running Fibonacci Spiral..."
    echo "Press ESC to exit the application."
    echo
    ./fibonacci_spiral
fi

echo
echo "Done!" 