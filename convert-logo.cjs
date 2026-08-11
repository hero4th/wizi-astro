const sharp = require('sharp');
const fs = require('fs');

async function convert() {
  try {
    // Attempt to convert SVG or WebP to PNG
    if (fs.existsSync('./public/logo.svg')) {
      await sharp('./public/logo.svg')
        .png()
        .toFile('./public/logo.png');
      console.log('Converted logo.svg to logo.png');
    } else if (fs.existsSync('./public/Proacademy-logo.webp')) {
      await sharp('./public/Proacademy-logo.webp')
        .png()
        .toFile('./public/logo.png');
      console.log('Converted Proacademy-logo.webp to logo.png');
    } else {
      console.log('No logo file found to convert.');
    }
  } catch (error) {
    console.error('Error converting logo:', error);
  }
}

convert();
