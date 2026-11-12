import sharp from 'sharp';

const inputPath = 'C:/Users/johnn/.gemini/antigravity/brain/6eeb9f66-8fd1-41d6-ae7c-476e8df1d7da/.user_uploaded/media_1794423271707_cc6644cf.png';
const outputPath = 'public/images/hero-paa.webp';

async function main() {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log('Original image info:', info);

  // Upscale by 2x for retina sharpness
  const scale = 2;
  const targetW = info.width * scale;
  const targetH = info.height * scale;

  const upscaledRaw = await sharp(inputPath)
    .ensureAlpha()
    .resize(targetW, targetH, { kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: pixels, info: uInfo } = upscaledRaw;
  const out = Buffer.from(pixels);

  // Round top-right and bottom-right corners of front paper
  // Front sheet right edge is around x = 1260
  // Top right corner: y = 108 to 180, x = 1180 to 1262. Radius r = 48px
  const rTR = 48;
  const cxTR = 1260 - rTR;
  const cyTR = 108 + rTR;
  for (let y = 108; y < cyTR; y++) {
    for (let x = cxTR; x < targetW; x++) {
      const dist = Math.hypot(x - cxTR, y - cyTR);
      if (dist > rTR) {
        const idx = (y * targetW + x) * 4;
        const alphaFade = Math.max(0, Math.min(255, (rTR + 1 - dist) * 255));
        out[idx + 3] = Math.min(out[idx + 3], alphaFade);
      }
    }
  }

  // Bottom right corner: y = 680 to 762, x = 1180 to 1262. Radius r = 48px
  const rBR = 48;
  const cxBR = 1260 - rBR;
  const cyBR = 760 - rBR;
  for (let y = cyBR; y < targetH; y++) {
    for (let x = cxBR; x < targetW; x++) {
      const dist = Math.hypot(x - cxBR, y - cyBR);
      if (dist > rBR) {
        const idx = (y * targetW + x) * 4;
        const alphaFade = Math.max(0, Math.min(255, (rBR + 1 - dist) * 255));
        out[idx + 3] = Math.min(out[idx + 3], alphaFade);
      }
    }
  }

  // Save the rounded high-res image
  await sharp(out, { raw: { width: targetW, height: targetH, channels: 4 } })
    .webp({ quality: 95, effort: 6 })
    .toFile(outputPath);

  console.log('Saved high-res hero-paa.webp with rounded corners successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
