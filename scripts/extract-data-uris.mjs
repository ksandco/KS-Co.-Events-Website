import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const sourcePath = resolve(process.argv[2] || 'dist/index.html');
const sourceDir = dirname(sourcePath);
const outputDir = join(sourceDir, 'assets', 'embedded');
const html = readFileSync(sourcePath, 'utf8');
const dataUriPattern = /data:([^;]+);base64,([A-Za-z0-9+/=]+)/g;

const extensions = {
  'font/woff2': 'woff2',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/x-icon': 'ico'
};

mkdirSync(outputDir, { recursive: true });

let replacements = 0;
let filesWritten = 0;
let bytesWritten = 0;

const output = html.replace(dataUriPattern, (full, mimeType, encoded) => {
  const extension = extensions[mimeType];
  if (!extension) {
    throw new Error(`Unsupported data URI type: ${mimeType}`);
  }

  const data = Buffer.from(encoded, 'base64');
  const hash = createHash('sha256').update(data).digest('hex').slice(0, 20);
  const filename = `${hash}.${extension}`;
  const targetPath = join(outputDir, filename);

  if (!existsSync(targetPath)) {
    writeFileSync(targetPath, data);
    filesWritten += 1;
    bytesWritten += data.length;
  }

  replacements += 1;
  return relative(sourceDir, targetPath).split(sep).join('/');
});

if (output === html) {
  console.log(JSON.stringify({ replacements: 0, filesWritten: 0, bytesWritten: 0 }));
  process.exit(0);
}

writeFileSync(sourcePath, output);
console.log(JSON.stringify({ replacements, filesWritten, bytesWritten }));
