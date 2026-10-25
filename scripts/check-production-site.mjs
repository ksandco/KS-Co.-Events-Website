import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'production');
const expectedRouteCount = 15;
const errors = [];
const titles = new Set();

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function localTargetExists(href) {
  const path = href.split(/[?#]/, 1)[0];
  if (path.startsWith('/assets/') || path.startsWith('/images/')) {
    return existsSync(join(root, path));
  }
  if (!path.endsWith('/')) {
    return existsSync(join(root, path.replace(/^\//, '')));
  }
  return existsSync(join(root, path.replace(/^\//, ''), 'index.html'));
}

if (!existsSync(join(root, 'index.html'))) {
  throw new Error('Production output is missing. Run the build first.');
}

const htmlFiles = walk(root).filter((path) => path.endsWith('.html'));

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const markup = html.split('<script>')[0];
  const name = relative(root, file);
  const is404 = name === '404.html';
  const panelCount = (markup.match(/<div class="review-page" data-review-page=/g) || []).length;
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];

  if (!is404 && panelCount !== 1) {
    errors.push(`${name}: expected one route panel, found ${panelCount}`);
  }
  if (!is404 && /<meta name="robots" content="noindex/.test(html)) {
    errors.push(`${name}: production route is marked noindex`);
  }
  if (/href="#[a-z]/i.test(markup)) {
    errors.push(`${name}: hash route remains in page markup`);
  }
  if (!is404 && !/rel="canonical"/.test(html)) {
    errors.push(`${name}: canonical URL is missing`);
  }
  if (is404 && /rel="canonical"/.test(html)) {
    errors.push('404.html: canonical URL should be absent');
  }
  if (!is404 && !/data-privacy-link/.test(markup)) {
    errors.push(`${name}: footer privacy link is missing`);
  }
  if (!title) {
    errors.push(`${name}: title is missing`);
  } else if (!is404 && titles.has(title)) {
    errors.push(`${name}: duplicate title: ${title}`);
  }
  titles.add(title);

  for (const match of markup.matchAll(/(?:href|src)="(\/[^"#]+)"/g)) {
    if (!localTargetExists(match[1])) {
      errors.push(`${name}: missing local target ${match[1]}`);
    }
  }
}

const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const sitemapCount = (sitemap.match(/<url>/g) || []).length;
if (sitemapCount !== expectedRouteCount) {
  errors.push(`sitemap.xml: expected ${expectedRouteCount} URLs, found ${sitemapCount}`);
}

const contact = readFileSync(join(root, 'contact', 'index.html'), 'utf8');
if (!contact.includes('By submitting, you agree that KS&amp;Co. Events may use')) {
  errors.push('contact/index.html: inquiry privacy disclosure is missing');
}
if (!contact.includes('href="/privacy/"')) {
  errors.push('contact/index.html: Privacy Policy link is missing');
}

if (htmlFiles.length !== expectedRouteCount + 1) {
  errors.push(`expected ${expectedRouteCount + 1} HTML files including 404, found ${htmlFiles.length}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Production checks passed: ${expectedRouteCount} routes, ${htmlFiles.length} HTML files, unique metadata, and valid local targets.`,
);
