import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPages, createFeed, escapeHtml, origin } from './site.js';
import { loadPosts } from './posts.js';

const root = dirname(fileURLToPath(import.meta.url));

// The CSP is site-wide: JSON-LD is a data block that browsers never execute, so it needs no hash.
const securityHeaders = {
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'none'; " +
    "connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; " +
    "frame-ancestors 'none'; manifest-src 'self'; script-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-write=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
};
const assetCache = 'public, max-age=3600';
const crawlerCache = 'public, max-age=300';
// The workers.dev preview host serves the same files; keep it out of search results.
const previewHost = 'https://lizz-blog.chopfarms.workers.dev';

function headerRule(path, headers) {
  return path + '\n' + Object.entries(headers).map(([name, value]) => '  ' + name + ': ' + value).join('\n') + '\n';
}

// Cloudflare serves /blog from blog.html and /blog/slug from blog/slug.html (html_handling: drop-trailing-slash).
function fileFor(path) {
  return path === '/' ? 'index.html' : path.slice(1) + '.html';
}

export function build(outDir = join(root, 'dist'), posts = loadPosts()) {
  const pages = createPages(posts);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  // public/ holds only deployable files; dotfiles are never published.
  cpSync(join(root, 'public'), outDir, {
    recursive: true,
    filter: source => !source.slice(join(root, 'public').length).split(/[\\/]/).some(part => part.startsWith('.')),
  });

  function write(file, body) {
    const target = join(outDir, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, body);
  }

  for (const [path, html] of pages) write(fileFor(path), html);

  const unlistedPaths = new Set(posts.filter(post => post.unlisted).map(post => '/blog/' + post.slug));
  write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    [...pages.keys()].filter(path => path !== '/404' && !unlistedPaths.has(path)).map(path =>
      '<url><loc>' + escapeHtml(origin + path) + '</loc></url>').join('') + '</urlset>');
  write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
  write('feed.xml', createFeed(posts));
  const securityExpiry = new Date();
  securityExpiry.setUTCFullYear(securityExpiry.getUTCFullYear() + 1);
  write('.well-known/security.txt', 'Contact: mailto:home@lizz.dev\n' +
    'Expires: ' + securityExpiry.toISOString() + '\nPreferred-Languages: en\n' +
    'Canonical: ' + origin + '/.well-known/security.txt\n');

  write('_headers', [
    headerRule('/*', securityHeaders),
    ...['/style.css', '/images/*', '/favicon.ico', '/favicon.png', '/apple-touch-icon.png',
      '/icon-192.png', '/icon-512.png', '/social.jpg', '/site.webmanifest']
      .map(path => headerRule(path, { 'Cache-Control': assetCache })),
    headerRule('/.well-known/security.txt', { 'Cache-Control': crawlerCache, 'Content-Type': 'text/plain; charset=utf-8' }),
    headerRule('/robots.txt', { 'Cache-Control': crawlerCache }),
    headerRule('/sitemap.xml', { 'Cache-Control': crawlerCache }),
    headerRule('/feed.xml', { 'Cache-Control': crawlerCache, 'Content-Type': 'application/rss+xml; charset=utf-8' }),
    headerRule(previewHost + '/*', { 'X-Robots-Tag': 'noindex' }),
  ].join('\n'));
  return outDir;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log('Built ' + build());
}
