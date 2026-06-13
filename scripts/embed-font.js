/* eslint-disable */
const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf';
let data = [];

const req = https.get(url, { timeout: 20000, headers: { 'User-Agent': 'Node.js' }}, (res) => {
  console.log('Status:', res.statusCode, 'Length:', res.headers['content-length']);
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    const buf = Buffer.concat(data);
    console.log('Buffer size:', buf.length);
    if (buf.slice(0,4).toString('hex') !== '00010000') {
      console.log('Not a valid TTF!');
      return;
    }
    const b64 = buf.toString('base64');
    const fontsDir = path.join(process.cwd(), 'lib', 'export', 'fonts');
    fs.mkdirSync(fontsDir, { recursive: true });
    
    const lines = [
      '// Auto-generated: NotoSans-Regular TTF embedded as base64',
      '// License: SIL Open Font License (OFL) — https://scripts.sil.org/OFL',
      '// Source: https://github.com/notofonts/noto-fonts',
      '// Supports Polish diacritics: ą ć ę ł ń ó ś ź ż Ą Ć Ę Ł Ń Ó Ś Ź Ż',
      '// Do not edit manually. Regenerate with scripts/embed-font.js',
      '',
      'export const NOTO_SANS_REGULAR_BASE64 = ' + JSON.stringify(b64) + ';',
      '',
    ].join('\n');
    
    fs.writeFileSync(path.join(fontsDir, 'noto-sans-regular.ts'), lines);
    console.log('Written font module, base64 length:', b64.length);
    console.log('File path:', path.join(fontsDir, 'noto-sans-regular.ts'));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.on('timeout', () => { req.destroy(); console.log('Timeout'); });
