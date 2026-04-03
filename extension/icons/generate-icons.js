const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];

const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fb7299"/>
      <stop offset="100%" style="stop-color:#fc9b99"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad)"/>
  <text x="64" y="88" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">D</text>
  <circle cx="100" cy="28" r="12" fill="#52c41a"/>
</svg>`;

sizes.forEach(size => {
  const svg = svgTemplate(size);
  fs.writeFileSync(path.join(__dirname, `icon${size}.svg`), svg);
  console.log(`Generated icon${size}.svg`);
});

console.log('\nSVG icons generated. To convert to PNG:');
console.log('1. Use an online converter like https://convertio.co/svg-png/');
console.log('2. Or use ImageMagick: magick convert icon128.svg icon128.png');
console.log('3. Or open in browser and screenshot');