const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table & calculation for PNG
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdr);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter 0
    rgbaBuffer.copy(row, 1, y * width * 4, (y + 1) * width * 4);
    rawRows.push(row);
  }
  const compressed = zlib.deflateSync(Buffer.concat(rawRows));
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate luxury Golden Faris icon at specified size
function renderFaresIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const scale = size / 256;
  const radius = 48 * scale;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded rectangle distance
      const dx = Math.max(Math.abs(x - cx) - (cx - radius), 0);
      const dy = Math.max(Math.abs(y - cy) - (cy - radius), 0);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius + 1) {
        // Transparent outside rounded corners
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      // Smooth antialiasing on corner borders
      const alpha = Math.min(Math.max(radius + 1 - dist, 0), 1);

      // Gold border detection
      const innerBorderDist = radius - 8 * scale;
      const isBorder = (dist >= innerBorderDist && dist <= radius);

      // Gradient angle
      const gradFactor = (x + y) / (size * 2);

      if (isBorder) {
        // Metallic Gold Border
        buf[idx] = Math.round(218 + 35 * gradFactor);     // R: ~218-253
        buf[idx + 1] = Math.round(175 + 40 * gradFactor); // G: ~175-215
        buf[idx + 2] = Math.round(55 + 50 * gradFactor);  // B: ~55-105
        buf[idx + 3] = Math.round(255 * alpha);
      } else {
        // Dark Obsidian Background with subtle navy gradient
        const bgR = Math.round(10 + 12 * gradFactor);
        const bgG = Math.round(14 + 16 * gradFactor);
        const bgB = Math.round(26 + 25 * gradFactor);

        // Center emblem (Golden Horse Silhouette & Billboard frame)
        // Normalized coordinates in [-1, 1]
        const nx = (x - cx) / (100 * scale);
        const ny = (y - cy) / (100 * scale);

        // Draw Stylized Horse / Billboard shape
        let inEmblem = false;

        // Billboard frame shape
        const inBillboard = Math.abs(nx) < 0.75 && Math.abs(ny + 0.1) < 0.52;
        const onBillboardBorder = inBillboard && (Math.abs(nx) > 0.65 || Math.abs(ny + 0.1) > 0.44);
        
        // Horse Head Silhouette approximate analytical curves
        const dHorseHead = Math.sqrt((nx - 0.1) ** 2 + (ny + 0.25) ** 2);
        const dHorseNeck = Math.sqrt((nx + 0.15) ** 2 + (ny - 0.1) ** 2);
        const inHorseMane = (nx > -0.4 && nx < 0.35 && ny > -0.45 && ny < 0.35 && (nx * 1.2 - ny) < 0.3 && (nx * 0.8 + ny) > -0.4);
        const inHorseSnout = (nx > 0.1 && nx < 0.55 && ny > -0.35 && ny < 0.05);

        if (inHorseMane || inHorseSnout || dHorseHead < 0.38 || (dHorseNeck < 0.45 && nx < 0.25)) {
          inEmblem = true;
        }

        if (onBillboardBorder || inEmblem) {
          // Radiant Gold Emblem
          const goldR = Math.round(225 + 30 * Math.sin(nx * 3 + ny * 3));
          const goldG = Math.round(180 + 35 * Math.sin(nx * 3 + ny * 3));
          const goldB = Math.round(65 + 30 * Math.sin(nx * 3 + ny * 3));
          buf[idx] = Math.min(255, goldR);
          buf[idx + 1] = Math.min(255, goldG);
          buf[idx + 2] = Math.min(255, goldB);
          buf[idx + 3] = Math.round(255 * alpha);
        } else {
          buf[idx] = bgR;
          buf[idx + 1] = bgG;
          buf[idx + 2] = bgB;
          buf[idx + 3] = Math.round(255 * alpha);
        }
      }
    }
  }
  return createPng(size, size, buf);
}

function buildIco(sizes) {
  const pngBuffers = sizes.map(s => renderFaresIcon(s));
  const count = pngBuffers.length;

  // ICO Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // Reserved = 0
  header.writeUInt16LE(1, 2);      // 1 = ICO format
  header.writeUInt16LE(count, 4);  // Number of images

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    const png = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s >= 256 ? 0 : s, 0); // Width (0 for 256)
    entry.writeUInt8(s >= 256 ? 0 : s, 1); // Height
    entry.writeUInt8(0, 2);                // Color count
    entry.writeUInt8(0, 3);                // Reserved
    entry.writeUInt16LE(1, 4);             // Color planes
    entry.writeUInt16LE(32, 6);            // Bits per pixel
    entry.writeUInt32LE(png.length, 8);    // Image size in bytes
    entry.writeUInt32LE(offset, 12);       // Offset from file start
    dirEntries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

function main() {
  const desktopDir = path.join(__dirname);
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(desktopDir)) {
    fs.mkdirSync(desktopDir, { recursive: true });
  }

  console.log('Generating high-resolution desktop application icons...');
  
  // 256x256 PNG icon
  const png256 = renderFaresIcon(256);
  fs.writeFileSync(path.join(desktopDir, 'icon.png'), png256);
  console.log('✓ Created desktop/icon.png (256x256)');

  // Multi-resolution ICO (256, 128, 64, 48, 32, 16)
  const icoBuffer = buildIco([256, 128, 64, 48, 32, 16]);
  fs.writeFileSync(path.join(desktopDir, 'icon.ico'), icoBuffer);
  console.log('✓ Created desktop/icon.ico (multi-res Windows Icon)');

  // Also copy to public/favicon.ico
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
    console.log('✓ Created public/favicon.ico');
  }

  console.log('Icon generation completed successfully.');
}

main();
