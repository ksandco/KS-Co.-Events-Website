import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'dist', 'index.html');
const outputDir = join(root, 'production');
const canonicalOrigin = 'https://www.ksandcoevents.com';
const web3FormsAccessKey = (process.env.WEB3FORMS_ACCESS_KEY || '').trim();

const routes = {
  home: {
    path: '/',
    title: 'KS&Co. Events | Event Planning & Production in Philadelphia',
    description: 'Thoughtful event planning, design, coordination, and production in Philadelphia, led by Kumbah Sarnor.',
    image: '/assets/embedded/8f8d2ec2ac36b3844d95.jpg',
  },
  services: {
    path: '/services/',
    title: 'Event Planning & Production | KS&Co. Events',
    description: 'Explore full and partial event planning, design direction, coordination, staffing, and production from KS&Co. Events.',
    image: '/assets/embedded/1a8626680105d88e0bcf.jpg',
  },
  'mini-services': {
    path: '/mini-services/',
    title: 'The Finishing Touch Mini Services | KS&Co. Events',
    description: 'Book focused planning help including timelines, venue walkthroughs, rehearsal coordination, consultations, vendor matching, and design direction.',
    image: '/assets/embedded/6bb234f882699c773c2f.jpg',
  },
  portfolio: {
    path: '/recent-events/',
    title: 'Recent Events | KS&Co. Events',
    description: 'See recent weddings and celebrations planned and produced by KS&Co. Events in Philadelphia and the surrounding region.',
    image: '/assets/embedded/8830753aa0490c1dde01.jpg',
  },
  'gallery-marissa-lydia': {
    path: '/recent-events/marissa-lydia/',
    title: 'Marissa & Lydia at Valley Green Inn | KS&Co. Events',
    description: 'A look inside Marissa and Lydia’s wedding at Valley Green Inn in Philadelphia.',
    image: '/images/gallery-mosaic/marissa-lydia/photo-04.jpg',
  },
  'gallery-mary-conor': {
    path: '/recent-events/mary-conor/',
    title: 'Mary & Conor at Artesano Gallery | KS&Co. Events',
    description: 'A look inside Mary and Conor’s wedding at Artesano Gallery in Philadelphia.',
    image: '/assets/embedded/8216fae9258b2304a751.jpg',
  },
  'gallery-kaela-cody': {
    path: '/recent-events/kaela-cody/',
    title: 'Kaela & Cody at John James Audubon Center | KS&Co. Events',
    description: 'A look inside Kaela and Cody’s wedding at the John James Audubon Center near Philadelphia.',
    image: '/images/gallery-mosaic/kaela-cody/photo-18.jpg',
  },
  'gallery-myrlie-conor': {
    path: '/recent-events/myrlie-conor/',
    title: 'Myrlie & Conor at Philadelphia Cricket Club | KS&Co. Events',
    description: 'A look inside Myrlie and Conor’s wedding at The Philadelphia Cricket Club.',
    image: '/images/gallery-mosaic/myrlie-conor/photo-34.jpg',
  },
  'gallery-samyuktha-robbie': {
    path: '/recent-events/samyuktha-robbie/',
    title: 'Samyuktha & Robbie at Bryn Mawr College | KS&Co. Events',
    description: 'A look inside Samyuktha and Robbie’s wedding at Bryn Mawr College in Bryn Mawr, Pennsylvania.',
    image: '/images/gallery-mosaic/samyuktha-robbie/photo-35.jpg',
  },
  about: {
    path: '/about/',
    title: 'Meet Kumbah Sarnor | KS&Co. Events',
    description: 'Meet Kumbah Sarnor, the Philadelphia event producer and hospitality professional behind KS&Co. Events.',
    image: '/assets/embedded/c9a3ccd0ba2005fbf6cb.jpg',
  },
  blog: {
    path: '/blog/',
    title: 'Event Planning Journal | KS&Co. Events',
    description: 'Planning guidance, practical answers, and stories from inside the work of KS&Co. Events.',
    image: '/assets/embedded/57ff2d24405c6f540094.jpg',
  },
  'blog-welcome': {
    path: '/blog/a-new-chapter/',
    title: 'A New Chapter for KS&Co. | KS&Co. Events',
    description: 'KS&Co. Events is growing its trusted Philadelphia event network and sharing what that means for clients.',
    image: '/assets/embedded/57ff2d24405c6f540094.jpg',
    article: {
      headline: 'A New Chapter for KS&Co.',
      author: 'Kumbah Sarnor',
    },
  },
  'blog-name': {
    path: '/blog/more-than-a-name/',
    title: 'More Than a Name | KS&Co. Events',
    description: 'Kumbah Sarnor shares the meaning behind KS&Co. Events and the collective spirit at the heart of the company.',
    image: '/assets/embedded/24fb81dbfc22bcc42c23.jpg',
    article: {
      headline: 'More Than a Name: The Meaning Behind KS&Co. Events',
      author: 'Kumbah Sarnor',
    },
  },
  contact: {
    path: '/contact/',
    title: 'Contact KS&Co. Events | Philadelphia Event Planner',
    description: 'Tell KS&Co. Events about your wedding, celebration, corporate event, or brand experience in Philadelphia.',
    image: '/assets/embedded/c245f4a2695e0a555518.jpg',
  },
  privacy: {
    path: '/privacy/',
    title: 'Privacy Policy | KS&Co. Events',
    description: 'Learn what information KS&Co. Events collects through this website and how it is used.',
    image: '/assets/embedded/24fb81dbfc22bcc42c23.jpg',
  },
};

const source = readFileSync(sourcePath, 'utf8');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function extractTagBlock(html, startToken, endToken) {
  const start = html.indexOf(startToken);
  const end = html.indexOf(endToken, start);
  if (start === -1 || end === -1) {
    throw new Error(`Could not find ${startToken} … ${endToken}`);
  }
  return html.slice(start, end + endToken.length);
}

function extractPanel(html, route) {
  const marker = `<div class="review-page" data-review-page="${route}"`;
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error(`Missing panel for route: ${route}`);
  }

  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = start;
  let depth = 0;
  let match;

  while ((match = tagPattern.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) {
      return html.slice(start, tagPattern.lastIndex);
    }
  }

  throw new Error(`Unbalanced div markup in panel: ${route}`);
}

function routeLinks(html) {
  return html.replace(/href="#([a-z0-9-]+)(\?[^"]*)?"/gi, (full, route, query = '') => {
    const target = routes[route];
    return target ? `href="${target.path}${query}"` : full;
  });
}

function rootAssetPaths(html) {
  return html
    .replace(/(["'(])assets\//g, '$1/assets/')
    .replace(/(["'(])images\//g, '$1/images/');
}

function addStaticPrivacyLink(html) {
  return html.replace(
    /(<a href="mailto:hello@ksandcoevents\.com">hello@ksandcoevents\.com<\/a>)(\s*<span>©)/,
    '$1\n    <a href="/privacy/" data-privacy-link>Privacy</a>$2',
  );
}

function injectWeb3FormsKey(html) {
  if (!web3FormsAccessKey) {
    return html;
  }
  return html
    .replace(
      'var ACCESS_KEY = \'\';',
      `var ACCESS_KEY = ${JSON.stringify(web3FormsAccessKey)};`,
    )
    .replace(
      'name="access_key" data-access-key value=""',
      `name="access_key" data-access-key value="${escapeHtml(web3FormsAccessKey)}"`,
    );
}

function structuredData(routeKey, route) {
  const canonical = canonicalOrigin + route.path;
  const graph = [
    {
      '@type': 'ProfessionalService',
      '@id': canonicalOrigin + '/#business',
      name: 'KS&Co. Events',
      url: canonicalOrigin + '/',
      email: 'hello@ksandcoevents.com',
      image: canonicalOrigin + route.image,
      founder: {
        '@type': 'Person',
        name: 'Kumbah Sarnor',
      },
      areaServed: {
        '@type': 'City',
        name: 'Philadelphia',
      },
      sameAs: ['https://www.instagram.com/ksandco_events/'],
    },
    {
      '@type': 'WebPage',
      '@id': canonical + '#webpage',
      url: canonical,
      name: route.title,
      description: route.description,
      isPartOf: {
        '@type': 'WebSite',
        '@id': canonicalOrigin + '/#website',
        name: 'KS&Co. Events',
        url: canonicalOrigin + '/',
      },
      about: {
        '@id': canonicalOrigin + '/#business',
      },
    },
  ];

  if (route.article) {
    graph.push({
      '@type': 'BlogPosting',
      '@id': canonical + '#article',
      mainEntityOfPage: { '@id': canonical + '#webpage' },
      headline: route.article.headline,
      description: route.description,
      image: canonicalOrigin + route.image,
      author: {
        '@type': 'Person',
        name: route.article.author,
      },
      publisher: {
        '@id': canonicalOrigin + '/#business',
      },
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function productionHead(routeKey, route) {
  const canonical = canonicalOrigin + route.path;
  const image = canonicalOrigin + route.image;
  const extras = [
    `<link rel="canonical" href="${canonical}" />`,
    '<meta property="og:site_name" content="KS&amp;Co. Events" />',
    `<meta property="og:type" content="${route.article ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${structuredData(routeKey, route)}</script>`,
  ].join('\n');

  return rootAssetPaths(
    head
      .replace('<meta name="robots" content="noindex,nofollow" />', '<meta name="robots" content="index,follow,max-image-preview:large" />')
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(route.description)}" />`)
      .replace('</head>', `${extras}\n</head>`),
  );
}

function outputPath(routePath) {
  return routePath === '/'
    ? join(outputDir, 'index.html')
    : join(outputDir, routePath.replace(/^\//, ''), 'index.html');
}

const head = extractTagBlock(source, '<head>', '</head>');
const header = extractTagBlock(source, '<header', '</header>');
const scriptStart = source.indexOf('<script>', source.indexOf('<noscript>'));
const scripts = source.slice(scriptStart, source.indexOf('</body>'));

if (scriptStart === -1) {
  throw new Error('Could not find site scripts');
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(join(root, 'dist', 'assets'), join(outputDir, 'assets'), { recursive: true });
cpSync(join(root, 'dist', 'images'), join(outputDir, 'images'), { recursive: true });

for (const [routeKey, route] of Object.entries(routes)) {
  const panel = extractPanel(source, routeKey).replace(/\s+hidden(?=>)/, '');
  const body = [
    routeLinks(header),
    addStaticPrivacyLink(routeLinks(panel)),
    rootAssetPaths(scripts),
  ].join('\n');
  const pageMarkup = [
    '<!doctype html>',
    '<html lang="en" class="js">',
    productionHead(routeKey, route),
    '<body>',
    rootAssetPaths(body),
    '</body>',
    '</html>',
    '',
  ].join('\n');
  const page = routeKey === 'contact'
    ? injectWeb3FormsKey(pageMarkup)
    : pageMarkup;
  const path = outputPath(route.path);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, page);
}

const homeHead = productionHead('home', routes.home)
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Page Not Found | KS&amp;Co. Events</title>')
  .replace('<meta name="robots" content="index,follow,max-image-preview:large" />', '<meta name="robots" content="noindex,follow" />')
  .replace(
    /<meta name="description" content="[^"]*" \/>/,
    '<meta name="description" content="The requested page could not be found." />',
  )
  .replace(/<link rel="canonical"[^>]*>\n/, '')
  .replace(/<meta property="og:[^"]+"[^>]*>\n/g, '')
  .replace(/<meta name="twitter:[^"]+"[^>]*>\n/g, '')
  .replace(/<script type="application\/ld\+json">[^<]*<\/script>\n/, '');
const notFound = `<!doctype html>
<html lang="en">
${homeHead}
<body>
${routeLinks(header)}
<main>
  <section class="page-head journal-head">
    <div class="wrap-narrow">
      <p class="eyebrow">404</p>
      <h1>That page could not be <em>found.</em></h1>
      <p class="lede">The link may have moved. Start again or tell us what you were looking for.</p>
      <div style="margin-top:32px"><a class="btn btn-solid" href="/">Return home</a></div>
    </div>
  </section>
</main>
</body>
</html>
`;
writeFileSync(join(outputDir, '404.html'), rootAssetPaths(notFound));

const sitemap = Object.values(routes)
  .map((route) => `  <url><loc>${canonicalOrigin}${route.path}</loc></url>`)
  .join('\n');
writeFileSync(
  join(outputDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap}
</urlset>
`,
);
writeFileSync(
  join(outputDir, 'robots.txt'),
  `User-agent: *
Allow: /

Sitemap: ${canonicalOrigin}/sitemap.xml
`,
);
writeFileSync(
  join(outputDir, '_redirects'),
  `/index.html  /  301
/home/      /  301
`,
);

if (!existsSync(join(outputDir, 'index.html'))) {
  throw new Error('Production build did not create an index page');
}

console.log(`Built ${Object.keys(routes).length} production routes in ${outputDir}`);
