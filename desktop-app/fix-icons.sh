#!/bin/bash
# Quick fix for Tauri icon issue

cd ~/ymmybttn/desktop-app/src-tauri

# Create minimal valid PNG using ImageMagick or Python
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to create icons..."
    convert -size 32x32 xc:red icons/32x32.png
    convert -size 128x128 xc:red icons/128x128.png
    convert -size 256x256 xc:red icons/128x128@2x.png
    convert icons/32x32.png icons/icon.ico
    cp icons/128x128.png icons/icon.icns
elif command -v python3 &> /dev/null; then
    echo "Using Python to create icons..."
    python3 << 'EOF'
from PIL import Image
import os

os.makedirs('icons', exist_ok=True)

# Create red square images
for size, filename in [(32, '32x32.png'), (128, '128x128.png'), (256, '128x128@2x.png')]:
    img = Image.new('RGB', (size, size), color='red')
    img.save(f'icons/{filename}')

# Create ICO and ICNS (using PNG for now)
Image.open('icons/32x32.png').save('icons/icon.ico')
Image.open('icons/128x128.png').save('icons/icon.icns')
print("Icons created successfully!")
EOF
else
    echo "Installing minimal PNG files..."
    # Create minimal 1x1 red PNG manually
    printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90\x77\x53\xde\x00\x00\x00\x0c\x49\x44\x41\x54\x08\xd7\x63\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > icons/32x32.png
    cp icons/32x32.png icons/128x128.png
    cp icons/32x32.png icons/128x128@2x.png
    cp icons/32x32.png icons/icon.ico
    cp icons/32x32.png icons/icon.icns
fi

echo "Icon files created. You can now run: npm run tauri dev"
