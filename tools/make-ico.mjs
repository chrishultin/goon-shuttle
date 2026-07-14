// Packs PNG frames into a multi-resolution favicon.ico (PNG-compressed entries,
// supported by all modern browsers). Usage:
//   node tools/make-ico.mjs favicon.ico favicon-16.png favicon-32.png favicon-48.png
import fs from 'node:fs';

const [out, ...pngPaths] = process.argv.slice(2);
if (!out || !pngPaths.length) {
  console.error('usage: node tools/make-ico.mjs <out.ico> <png...>');
  process.exit(1);
}

const pngs = pngPaths.map(p => fs.readFileSync(p));
// PNG width/height live at byte offsets 16/20 (IHDR), big-endian uint32.
const dims = pngs.map(b => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) }));

const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);      // reserved
header.writeUInt16LE(1, 2);      // type: 1 = icon
header.writeUInt16LE(count, 4);  // image count

const entries = Buffer.alloc(16 * count);
let offset = 6 + 16 * count;
pngs.forEach((png, i) => {
  const { w, h } = dims[i];
  const e = i * 16;
  entries.writeUInt8(w >= 256 ? 0 : w, e + 0);   // width (0 => 256)
  entries.writeUInt8(h >= 256 ? 0 : h, e + 1);   // height
  entries.writeUInt8(0, e + 2);                  // palette count
  entries.writeUInt8(0, e + 3);                  // reserved
  entries.writeUInt16LE(1, e + 4);               // color planes
  entries.writeUInt16LE(32, e + 6);              // bits per pixel
  entries.writeUInt32LE(png.length, e + 8);      // size of image data
  entries.writeUInt32LE(offset, e + 12);         // offset of image data
  offset += png.length;
});

fs.writeFileSync(out, Buffer.concat([header, entries, ...pngs]));
console.log(`wrote ${out} (${count} frames: ${dims.map(d => d.w).join(', ')})`);
