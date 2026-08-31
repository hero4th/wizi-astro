import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/logo.svg");

// Render at 3x the display width (180px in the email template) for retina sharpness.
await sharp(svg, { density: 384 })
  .resize({ width: 540, height: null, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile("public/email-logo.png");

console.log("done");
