/**
 * One-off script:
 *   1. Crop the brand logo down to just the "TREND" wordmark (no subtitle / signature)
 *      → writes src/assets/brand/trend-wordmark.png for use in Hero / About / Footer.
 *   2. Crop the crown-T from the wordmark and generate favicons.
 * Run with:  node backend/scripts/make-favicon.mjs
 */
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(__dirname, '../../src/assets/brand/trend-logo.png')
const BRAND = resolve(__dirname, '../../src/assets/brand')
const PUBLIC = resolve(__dirname, '../../public')

// ── 1. Wordmark (crown + "TREND" letters, no subtitle/signature) ─────────────
// The source is 1378x814. The HAIR BOUTIQUE STUDIO subtitle begins around y≈460.
const wordmarkSlice = await sharp(SOURCE)
  .extract({ left: 0, top: 0, width: 1378, height: 460 })
  .toBuffer()
const wordmark = await sharp(wordmarkSlice).trim({ threshold: 10 }).toBuffer()
await sharp(wordmark).toFile(resolve(BRAND, 'trend-wordmark.png'))
const meta = await sharp(wordmark).metadata()
console.log(`✓ wrote src/assets/brand/trend-wordmark.png (${meta.width}x${meta.height})`)

// The crown-T sits on the left side of the 1378x814 source.
// Extract it, then auto-trim transparent edges separately.
const slice = await sharp(SOURCE)
  .extract({ left: 60, top: 20, width: 270, height: 720 })
  .toBuffer()
const cropped = await sharp(slice)
  .trim({ threshold: 10 })
  .toBuffer()

// Pad the portrait T into a square with transparent background, then generate sizes
const SIZES = [16, 32, 48, 180, 512]
for (const size of SIZES) {
  const out = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`
  await sharp(cropped)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(resolve(PUBLIC, out))
  console.log(`✓ wrote public/${out} (${size}x${size})`)
}

// Also save the cropped source for reference
await sharp(cropped).toFile(resolve(PUBLIC, 'favicon-source.png'))
console.log('✓ wrote public/favicon-source.png (uncropped, for reference)')
