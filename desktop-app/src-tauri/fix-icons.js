#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Create a minimal valid 1x1 PNG (red pixel)
const createMinimalPNG = () => {
  const png = Buffer.concat([
    // PNG signature
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    // IHDR chunk
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // chunk length
    Buffer.from('IHDR'),
    Buffer.from([
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, // bit depth: 8
      0x02, // color type: 2 (RGB)
      0x00, // compression method: 0
      0x00, // filter method: 0
      0x00  // interlace method: 0
    ]),
    Buffer.from([0x90, 0x77, 0x53, 0xDE]), // CRC
    // IDAT chunk
    Buffer.from([0x00, 0x00, 0x00, 0x0C]), // chunk length
    Buffer.from('IDAT'),
    Buffer.from([0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01, 0x01, 0x01, 0x00, 0x00]),
    Buffer.from([0x1B, 0xB6, 0xEE, 0x56]), // CRC
    // IEND chunk
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // chunk length
    Buffer.from('IEND'),
    Buffer.from([0xAE, 0x42, 0x60, 0x82]) // CRC
  ]);
  return png;
};

const iconsDir = path.join(__dirname, 'icons');

// Create all required PNG files
const pngData = createMinimalPNG();
['32x32.png', '128x128.png', '128x128@2x.png'].forEach(filename => {
  fs.writeFileSync(path.join(iconsDir, filename), pngData);
  console.log(`Created ${filename}`);
});

// For ICO and ICNS, we'll use the PNG data as placeholder
// In production, you'd use proper tools to convert
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), pngData);
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), pngData);

console.log('\nCreated placeholder icons. Replace with proper icons before release!');
