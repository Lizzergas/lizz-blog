import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../build.js';
import { loadPosts } from '../posts.js';
import { createPages, createFeed, escapeHtml } from '../site.js';

let dist;
before(() => { dist = build(mkdtempSync(join(tmpdir(), 'lizz-dist-'))); });
after(() => { rmSync(dist, { recursive: true, force: true }); });

// Mirrors Cloudflare's html_handling: drop-trailing-slash.
const page = path => readFileSync(join(dist, path === '/' ? 'index.html' : path.slice(1) + '.html'), 'utf8');
const file = path => readFileSync(join(dist, path), 'utf8');
function headerRules() {
  const rules = new Map();
  let current;
  for (const line of file('_headers').split('\n')) {
    if (!line.trim()) continue;
    if (/^\s/.test(line)) {
      const [name, ...value] = line.trim().split(':');
      rules.get(current)[name.toLowerCase()] = value.join(':').trim();
    } else rules.set(current = line.trim(), {});
  }
  return rules;
}
function listFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? listFiles(join(directory, entry.name), prefix + entry.name + '/')
    : [prefix + entry.name]);
}

test('pages have crawlable content, one H1, correct navigation, canonical and social metadata', () => {
  for (const path of ['/', '/blog', '/about', '/blog/announcing-lizz-studio', '/blog/hello-world-old']) {
    const html = page(path);
    assert.match(html, /^<!doctype html>/);
    assert.match(html, /<main id="main"/);
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    assert.ok(html.includes('<link rel="canonical" href="https://lizz.dev' + path + '">'));
    assert.match(html, /og:image" content="https:\/\/lizz.dev\/social.jpg\?v=1"/);
    assert.match(html, /twitter:card" content="summary_large_image"/);
    assert.match(html, /rel="apple-touch-icon"/);
    assert.match(html, /rel="manifest"/);
    assert.doesNotMatch(html, /{{\w+}}|htmx|cdn.jsdelivr|tailwindcss|onclick=/);
    assert.doesNotMatch(html, /<script[^>]+src=|data-copy-article|copy-button|class="intro-title"|>GitHub</);
    const header = html.match(/<header class="site-header">([^]*?)<\/header>/)[1];
    const footer = html.match(/<footer class="site-footer">([^]*?)<\/footer>/)[1];
    assert.match(header, /href="\/blog"[^>]*>Blog<\/a>/);
    assert.match(header, /href="\/about"[^>]*>About<\/a>/);
    assert.doesNotMatch(header, />Work<|>Writing<|studio-contact|studio-social|mailto:/);
    assert.match(footer, /mailto:home@lizz.dev/);
    assert.match(footer, /href="https:\/\/x.com\/Lizzergas"[^>]*aria-label="X"/);
    assert.match(footer, /href="https:\/\/www.youtube.com\/@LizzStudio"[^>]*aria-label="YouTube"/);
    assert.ok(html.indexOf('</main>') < html.indexOf('<footer'));
    if (path === '/about') {
      assert.match(html, /href="\/about" aria-current="page"/);
      const copy = html.match(/<div class="prose about-copy">([^]*?)<\/div>/)[1];
      assert.doesNotMatch(copy, /My work includes|I also|Never Sleep|Clankerfront/);
    }
    if (path.startsWith('/blog')) assert.match(html, /href="\/blog" aria-current="page"/);
    const json = html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1];
    assert.equal(JSON.parse(json)['@context'], 'https://schema.org');
    assert.ok(Buffer.byteLength(html) < 16000, path + ' should stay small');
  }
});

test('home groups games and apps, with Games selected and Clankerfront paused', () => {
  const html = page('/');
  const games = html.slice(html.indexOf('id="games-panel"'), html.indexOf('id="apps-panel"'));
  const apps = html.slice(html.indexOf('id="apps-panel"'), html.indexOf('<section id="writing"'));
  assert.match(html, /id="category-games"[^>]*checked/);
  assert.doesNotMatch(html, /id="category-apps"[^>]*checked/);
  assert.ok(games.indexOf('Chop Farms') < games.indexOf('Clankerfront'));
  assert.match(games, /project-paused[^]*Paused/);
  assert.doesNotMatch(games, /Never Sleep/);
  assert.match(apps, /Never Sleep/);
  assert.doesNotMatch(apps, /Chop Farms|Clankerfront/);
  assert.match(html, /class="post-preview" href="\/blog\/announcing-lizz-studio"/);
  assert.match(html, /class="post-preview-title">Announcing Lizz Studio<\/h3>/);
  assert.doesNotMatch(html, /Hello world|hello-world-old/);
  const announcement = loadPosts().find(post => post.slug === 'announcing-lizz-studio');
  assert.equal(announcement.body, '');
  assert.equal(announcement.preview, '');
  assert.doesNotMatch(html, /<p>\s*<\/p>/);
  assert.match(html, /<h2 id="writing-title">Blog<\/h2>/);
  assert.match(html, /class="studio-contact"[^]*mailto:home@lizz.dev/);
  assert.match(html, /<h1 id="projects-title">Projects<\/h1>/);
});

test('unlisted original article keeps its URL, body and date with noindex metadata', () => {
  const html = page('/blog/hello-world-old');
  assert.match(html, /<h1>Hello world<\/h1>/);
  assert.match(html, /Jul 19, 2024/);
  assert.match(html, /Lapis/);
  assert.doesNotMatch(html, /data-copy-article|Copy article|app.js/);
  assert.match(html, /og:type" content="article"/);
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.doesNotMatch(html, /<!--\s*unlisted/);
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1]);
  const article = json['@graph'].find(item => item['@type'] === 'BlogPosting');
  assert.equal(article.datePublished, '2024-07-19T00:00:00Z');
  assert.equal(article.author.name, 'Lizz');
  assert.equal(article.mainEntityOfPage, 'https://lizz.dev/blog/hello-world-old');
});

test('the build publishes exactly the pages, crawler files and public assets', () => {
  const expected = [
    '_headers', '404.html', 'about.html', 'blog.html', 'index.html', 'feed.xml', 'robots.txt', 'sitemap.xml',
    ...loadPosts().map(post => 'blog/' + post.slug + '.html'),
    ...listFiles(new URL('../public/', import.meta.url).pathname).filter(name => !name.split('/').some(part => part.startsWith('.'))),
  ].sort();
  assert.deepEqual(listFiles(dist).sort(), expected);
  for (const path of ['style.css', 'images/forest-edge.webp', 'favicon.ico', 'social.jpg', 'site.webmanifest',
    ...['favicon', 'apple-touch-icon', 'icon-192', 'icon-512'].map(name => name + '.png'),
    ...['studio', 'never-sleep', 'chop-farms', 'clankerfront'].flatMap(name =>
      ['', '@2x'].map(scale => 'images/' + name + scale + '.webp'))]) {
    assert.ok(readFileSync(join(dist, path)).byteLength > 0, path);
  }
  for (const path of ['package.json', 'build.js', 'content', 'concepts', 'views', '.git']) {
    assert.equal(existsSync(join(dist, path)), false, path);
  }
  const manifest = JSON.parse(file('site.webmanifest'));
  assert.equal(manifest.name, 'Lizz Studio');
  assert.equal(manifest.icons.length, 2);
});

test('the not-found page is noindex without a canonical URL', () => {
  const html = file('404.html');
  assert.match(html, /Page not found/);
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.doesNotMatch(html, /rel="canonical"/);
});

test('Cloudflare serves the built directory with clean URLs and a real 404 page', () => {
  const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.name, 'lizz-blog');
  assert.equal(config.build.command, 'node build.js');
  assert.deepEqual(config.assets, {
    directory: './dist', html_handling: 'drop-trailing-slash', not_found_handling: '404-page',
  });
  assert.equal(config.main, undefined, 'the site is static assets only');
  assert.deepEqual(config.routes.map(route => route.pattern), ['lizz.dev', 'www.lizz.dev']);
  assert.ok(config.routes.every(route => route.custom_domain));
});

test('robots, sitemap and RSS expose canonical public URLs', () => {
  const robots = file('robots.txt');
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(robots, /Sitemap: https:\/\/lizz.dev\/sitemap.xml/);
  const sitemap = file('sitemap.xml');
  for (const path of ['/', '/blog', '/about', '/blog/announcing-lizz-studio']) {
    assert.ok(sitemap.includes('<loc>https://lizz.dev' + path + '</loc>'));
  }
  assert.doesNotMatch(sitemap, /404|localhost|concepts|hello-world-old/);
  assert.match(headerRules().get('/feed.xml')['content-type'], /application\/rss\+xml/);
  const xml = file('feed.xml');
  assert.match(xml, /<title>Announcing Lizz Studio<\/title>/);
  assert.match(xml, /Tue, 10 Nov 2026 00:00:00 GMT/);
  assert.doesNotMatch(xml, /Hello world|hello-world-old/);
  const blog = page('/blog');
  assert.match(blog, /Announcing Lizz Studio/);
  assert.doesNotMatch(blog, /Hello world|hello-world-old/);
});

test('every response gets restrictive security headers and sensible caching', () => {
  const rules = headerRules();
  const all = rules.get('/*');
  const policy = all['content-security-policy'];
  assert.match(policy, /default-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /base-uri 'none'/);
  assert.match(policy, /form-action 'none'/);
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
  assert.ok(policy.length < 2000, "Cloudflare's header value limit");
  assert.equal(all['x-content-type-options'], 'nosniff');
  assert.equal(all['x-frame-options'], 'DENY');
  assert.equal(all['strict-transport-security'], 'max-age=31536000');
  assert.match(all['permissions-policy'], /camera=\(\)/);
  assert.equal(all['cache-control'], undefined, 'HTML keeps Cloudflare revalidation');
  assert.equal(rules.get('/style.css')['cache-control'], 'public, max-age=3600');
  assert.equal(rules.get('/images/*')['cache-control'], 'public, max-age=3600');
  for (const path of ['/robots.txt', '/sitemap.xml', '/feed.xml']) {
    assert.equal(rules.get(path)['cache-control'], 'public, max-age=300');
  }
  assert.equal(rules.get('https://lizz-blog.chopfarms.workers.dev/*')['x-robots-tag'], 'noindex');
  assert.ok(rules.size <= 100, "Cloudflare's _headers rule limit");
});

test('extra Markdown H1s become subheadings, including inside blockquotes and lists', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lizz-headings-'));
  try {
    const fence = String.fromCharCode(96).repeat(3);
    writeFileSync(join(directory, '2026-01-01-headings.md'),
      '# Article title\n\nAn intro.\n\n# Section\n\n> # Quoted heading\n\n- # List heading\n\n' +
      fence + 'md\n# Literal code heading\n' + fence);
    const posts = loadPosts(pathToFileURL(directory + '/'));
    const html = createPages(posts).get('/blog/headings');
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.match(html, /<h1>Article title<\/h1>/);
    for (const title of ['Section', 'Quoted heading', 'List heading']) {
      assert.ok(posts[0].body.includes('<h2>' + title + '</h2>'));
    }
    assert.match(posts[0].body, /# Literal code heading/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('writing previews show the opening three sentences and link to the full post', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lizz-previews-'));
  try {
    const path = join(directory, '2026-01-01-preview.md');
    writeFileSync(path, '# A post\n\nFirst sentence. Second sentence.\n\nThird sentence. Fourth sentence.');
    const posts = loadPosts(pathToFileURL(directory + '/'));
    assert.equal(posts[0].preview, 'First sentence. Second sentence. Third sentence.');
    const pages = createPages(posts);
    for (const route of ['/', '/blog']) {
      const html = pages.get(route);
      assert.match(html, /class="post-preview" href="\/blog\/preview"/);
      assert.match(html, /First sentence\. Second sentence\. Third sentence\./);
      assert.doesNotMatch(html, /Fourth sentence/);
    }
    assert.match(pages.get('/blog/preview'), /Fourth sentence/);
    writeFileSync(path, '# Long intro\n\n' + 'A long introduction '.repeat(50));
    assert.ok(loadPosts(pathToFileURL(directory + '/'))[0].preview.length <= 420);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('formatted titles and previews preserve readable text, entities, references and code identifiers', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lizz-readable-text-'));
  try {
    const tick = String.fromCharCode(96);
    writeFileSync(join(directory, '2026-01-01-formatting.md'),
      '# **A _useful_** &amp; [guide][docs] ' + tick + 'file_name' + tick + '\n\n' +
      'Use <abbr title="Application Programming Interface">API</abbr> &amp; **_tools_** with [the docs][docs] and ' + tick + 'user_id' + tick + '. ' +
      'Second sentence with &copy; and &#x1F332;. Third sentence.<br>Fourth sentence.\n\n' +
      '[docs]: https://example.com/docs\n');
    const posts = loadPosts(pathToFileURL(directory + '/'));
    assert.equal(posts[0].title, 'A useful & guide file_name');
    assert.equal(posts[0].preview, 'Use API & tools with the docs and user_id. Second sentence with © and 🌲. Third sentence.');
    assert.equal(posts[0].excerpt, posts[0].preview + ' Fourth sentence.');
    const pages = createPages(posts);
    const article = pages.get('/blog/formatting');
    assert.match(article, /<h1>A useful &amp; guide file_name<\/h1>/);
    assert.match(pages.get('/'), /Use API &amp; tools with the docs and user_id\./);
    assert.match(posts[0].body, /<code>user_id<\/code>/);
    assert.doesNotMatch(article, /stronguseful|abbr title=&quot;|\[the docs\]\[docs\]|&amp;amp;/);
    const graph = JSON.parse(article.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1])['@graph'];
    assert.equal(graph[2].headline, posts[0].title);
    assert.equal(graph[2].description, posts[0].excerpt);
    assert.match(createFeed(posts), /Use API &amp; tools with the docs and user_id\./);
    assert.doesNotMatch(createFeed(posts), /&amp;amp;/);
    writeFileSync(join(directory, '2026-01-01-formatting.md'), '# Emoji intro\n\n' + '🌲'.repeat(300));
    const emojiPost = loadPosts(pathToFileURL(directory + '/'))[0];
    assert.equal(emojiPost.excerpt.isWellFormed(), true);
    assert.equal(emojiPost.preview.isWellFormed(), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('authored HTML headings are normalized without modifying code examples', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lizz-html-headings-'));
  try {
    const fence = String.fromCharCode(96).repeat(3);
    writeFileSync(join(directory, '2026-01-01-html-headings.md'),
      '# Article title\n\nAn intro.\n\n<div><H1 class="section">HTML section</H1><p>Raw paragraph.</p></div>\n\n' +
      '<h1 hidden>Hidden section</h1>\n\n' + fence + 'html\n<h1>Literal heading</h1>\n' + fence);
    const posts = loadPosts(pathToFileURL(directory + '/'));
    const html = createPages(posts).get('/blog/html-headings');
    assert.equal((html.match(/<h1[\s>]/gi) ?? []).length, 1);
    assert.match(posts[0].body, /<h2 class="section">HTML section<\/h2>/);
    assert.match(posts[0].body, /<h2 hidden[^>]*>Hidden section<\/h2>/);
    assert.match(posts[0].body, /&lt;h1&gt;Literal heading&lt;\/h1&gt;/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('HTML paragraphs supply previews while hidden text and non-content stay excluded', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lizz-html-previews-'));
  try {
    writeFileSync(join(directory, '2026-01-01-html-preview.md'),
      '# HTML intro\n\n<div hidden><p>Hidden paragraph.</p></div>\n\n' +
      '<div><p>First &eacute; sentence.</p><p>Second with <code>user_id</code>.</p><p>Third sentence.</p><p>Fourth sentence.</p></div>');
    const post = loadPosts(pathToFileURL(directory + '/'))[0];
    assert.equal(post.excerpt, 'First é sentence.');
    assert.equal(post.preview, 'First é sentence. Second with user_id. Third sentence.');
    assert.match(post.body, /Hidden paragraph/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('empty writing and hostile metadata stay valid and escaped', () => {
  assert.match(createPages([]).get('/blog'), /No posts yet/);
  const post = {
    slug: 'escape-test', title: '</script><script>alert("x")</script>',
    date: '2026-01-01', formattedDate: 'Jan 1, 2026', excerpt: 'A < B & C', body: '<p>Trusted author HTML.</p>',
  };
  const html = createPages([post]).get('/blog/escape-test');
  assert.match(html, /&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
  const json = html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1];
  assert.equal(JSON.parse(json)['@graph'][2].headline, post.title);
  assert.match(createFeed([post]), /A &lt; B &amp; C/);
});

test('Markdown headings, code, lists, dates, sorting, and duplicate URLs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lizz-posts-'));
  const url = pathToFileURL(directory + '/');
  try {
    const fence = String.fromCharCode(96).repeat(3);
    writeFileSync(join(directory, '2025-12-01-new-post.md'), '# A new post\n\nAn intro.\n\n## Details\n\n- First\n- Second\n\n' + fence + 'js\nconst answer = 42;\n' + fence);
    writeFileSync(join(directory, '2024-01-01-old-post.md'), 'An older post.');
    const posts = loadPosts(url);
    assert.equal(posts[0].title, 'A new post');
    assert.equal(posts[0].formattedDate, 'Dec 1, 2025');
    assert.doesNotMatch(posts[0].body, /<h1/);
    assert.match(posts[0].body, /<h2>Details<\/h2>/);
    assert.match(posts[0].body, /<ul>/);
    assert.match(posts[0].body, /<pre><code class="language-js">/);
    assert.equal(posts[1].title, 'Old Post');
    writeFileSync(join(directory, '2025-02-30-invalid.md'), 'Invalid date.');
    assert.throws(() => loadPosts(url), /Invalid post date/);
    rmSync(join(directory, '2025-02-30-invalid.md'));
    writeFileSync(join(directory, '2026-01-01-new-post.md'), 'Duplicate slug.');
    assert.throws(() => loadPosts(url), /Duplicate post slug/);
    assert.equal(escapeHtml('<"hello" & \'bye\'>'), '&lt;&quot;hello&quot; &amp; &#39;bye&#39;&gt;');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
