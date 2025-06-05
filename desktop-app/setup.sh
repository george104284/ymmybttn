#!/bin/bash
# Quick setup script for ymmybttn desktop app

echo "Setting up ymmybttn desktop app..."

# Navigate to desktop app directory
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "src-tauri/Cargo.toml" ]; then
    echo "Error: Not in desktop-app directory"
    exit 1
fi

# Create icons if they don't exist
if [ ! -d "src-tauri/icons" ]; then
    echo "Creating icons directory..."
    mkdir -p src-tauri/icons
fi

# Create minimal valid PNG files using printf (works on most systems)
echo "Creating placeholder icons..."
cd src-tauri/icons

# Create a minimal valid 1x1 red PNG with proper binary data
echo -ne '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90\x77\x53\xde\x00\x00\x00\x0c\x49\x44\x41\x54\x08\xd7\x63\xf8\x0f\x00\x00\x01\x01\x01\x00\x1b\xb6\xee\x56\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > temp.png

# Copy to all required files
cp temp.png 32x32.png
cp temp.png 128x128.png
cp temp.png 128x128@2x.png
cp temp.png icon.ico
cp temp.png icon.icns
rm temp.png

cd ../..

echo "Icons created successfully!"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "Setup complete! You can now run:"
echo "  npm run tauri dev"
echo ""
echo "Note: The icons are placeholders. Replace them with actual app icons before release."
