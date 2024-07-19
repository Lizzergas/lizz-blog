#!/bin/bash

# Define the build directory
BUILD_DIR="build"

# Remove all files in the build directory
echo "Cleaning build directory..."
rm -rf $BUILD_DIR/*
mkdir -p $BUILD_DIR

# Download static files
echo "Downloading static files..."
wget --mirror --convert-links --adjust-extension --page-requisites --no-parent http://localhost:8080 -P $BUILD_DIR

# Move files to the root of the build directory (optional, depending on your setup)
echo "Organizing downloaded files..."
mv $BUILD_DIR/localhost:8080/* $BUILD_DIR/
rm -rf $BUILD_DIR/localhost:8080

echo "Download complete. Static files are in the $BUILD_DIR directory."

