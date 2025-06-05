#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to create a minimal valid PNG
function createMinimalPNG(width, height) {
    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type (RGB)
    ihdr[10] = 0; // compression method
    ihdr[11] = 0; // filter method
    ihdr[12] = 0; // interlace method
    
    // Create IHDR chunk with CRC
    const ihdrChunk = createChunk('IHDR', ihdr);
    
    // Create a simple IDAT chunk (compressed image data)
    // This creates a solid color image
    const scanline = Buffer.alloc(width * 3 + 1); // +1 for filter byte
    scanline[0] = 0; // filter type
    for (let i = 1; i < scanline.length; i += 3) {
        scanline[i] = 0x44;     // R
        scanline[i + 1] = 0x66; // G
        scanline[i + 2] = 0x88; // B
    }
    
    // Simple deflate compression (uncompressed block)
    const idat = Buffer.concat([
        Buffer.from([0x78, 0x9C]), // zlib header
        Buffer.from([0x01]), // last block, uncompressed
        Buffer.from([scanline.length & 0xFF, (scanline.length >> 8) & 0xFF]), // length
        Buffer.from([~scanline.length & 0xFF, (~scanline.length >> 8) & 0xFF]), // one's complement
        scanline,
        Buffer.from([0x00, 0x00, 0x00, 0x00]) // Adler-32 checksum (simplified)
    ]);
    
    const idatChunk = createChunk('IDAT', idat);
    
    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));
    
    // Combine all chunks
    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Function to create a PNG chunk with CRC
function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    
    const typeBuffer = Buffer.from(type, 'ascii');
    const crc = calculateCRC(Buffer.concat([typeBuffer, data]));
    
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// Simple CRC32 calculation
function calculateCRC(data) {
    let crc = 0xFFFFFFFF;
    const polynomial = 0xEDB88320;
    
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ polynomial;
            } else {
                crc >>>= 1;
            }
        }
    }
    
    return crc ^ 0xFFFFFFFF;
}

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Create PNG files
const sizes = [
    { name: '32x32.png', width: 32, height: 32 },
    { name: '128x128.png', width: 128, height: 128 },
    { name: '128x128@2x.png', width: 256, height: 256 }
];

sizes.forEach(({ name, width, height }) => {
    const png = createMinimalPNG(width, height);
    fs.writeFileSync(path.join(iconsDir, name), png);
    console.log(`Created ${name}`);
});

// For ICO and ICNS, we'll use the 32x32 PNG as a placeholder
const png32 = createMinimalPNG(32, 32);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), png32);
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), png32);

console.log('\nPlaceholder icons created successfully!');
console.log('Note: Replace these with proper icons before release.');
