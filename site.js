import { readFileSync } from 'node:fs';
import { loadPosts } from './posts.js';

export const origin = 'https://lizz.dev';
const templates = Object.fromEntries(
  ['layout', 'index', 'blog', 'about', 'post', 'post-link', 'not-found'].map(name => [
    name, readFileSync(new URL('./views/' + name + '.html', import.meta.url), 'utf8'),
  ]),
);

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

// Only rendered templates and author-owned Markdown may bypass HTML escaping.
function render(name, values = {}, raw = {}) {
  return templates[name].replace(/{{(\w+)}}/g, (_, key) => {
    if (Object.hasOwn(raw, key)) return raw[key];
    if (Object.hasOwn(values, key)) return escapeHtml(values[key]);
    throw new Error('Missing ' + key + ' in ' + name + '.html');
  });
}

function postList(posts, headingLevel = 3) {
  return posts.length
    ? '<ul class="post-list">' + posts.map(post => {
      const preview = post.preview ?? post.excerpt;
      return render('post-link', { ...post, headingTag: 'h' + headingLevel }, {
        previewParagraph: preview ? '<p>' + escapeHtml(preview) + '</p>' : '',
      });
    }).join('\n') + '</ul>'
    : '<p class="page-intro">No posts yet. Check back soon.</p>';
}

function structuredData(path, title, description, post) {
  const organization = {
    '@type': 'Organization', '@id': origin + '/#studio', name: 'Lizz Studio',
    url: origin + '/', logo: origin + '/icon-512.png', email: 'home@lizz.dev',
    sameAs: ['https://x.com/Lizzergas', 'https://www.youtube.com/@LizzStudio'],
  };
  const website = {
    '@type': 'WebSite', '@id': origin + '/#website', name: 'Lizz Studio',
    url: origin + '/', publisher: { '@id': organization['@id'] }, inLanguage: 'en',
  };
  const page = {
    '@type': post ? 'BlogPosting' : path === '/blog' ? 'CollectionPage' : path === '/about' ? 'AboutPage' : 'WebPage',
    '@id': origin + path, url: origin + path, name: title, description,
    isPartOf: { '@id': website['@id'] }, inLanguage: 'en',
  };
  if (post) Object.assign(page, {
    headline: post.title, datePublished: post.date + 'T00:00:00Z',
    author: { '@type': 'Person', name: 'Lizz', url: origin + '/about' },
    publisher: { '@id': organization['@id'] },
    mainEntityOfPage: origin + path, image: origin + '/social.jpg?v=1',
  });
  // Escaping '<' prevents an authored title from closing the JSON-LD script.
  return '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, website, page] })
      .replace(/</g, '\\u003c') + '</script>';
}

export function createPages(posts = loadPosts()) {
  const pages = new Map();
  const listedPosts = posts.filter(post => !post.unlisted);
  function add(path, title, description, content, active, post) {
    const notFound = path === '/404';
    pages.set(path, render('layout', {
      title, description, canonical: origin + path,
      robots: notFound || post?.unlisted ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      ogType: post ? 'article' : 'website',
    }, {
      content,
      canonicalLink: notFound ? '' : '<link rel="canonical" href="' + origin + path + '">',
      homeCurrent: active === 'home' ? 'aria-current="page"' : '',
      blogCurrent: active === 'blog' ? 'aria-current="page"' : '',
      aboutCurrent: active === 'about' ? 'aria-current="page"' : '',
      articleMeta: post ? '<meta property="article:published_time" content="' + post.date +
        'T00:00:00Z">\n  <meta property="article:author" content="Lizz">' : '',
      structuredData: notFound ? '' : structuredData(path, title, description, post),
    }));
  }
  add('/', 'Lizz Studio — Apps and games',
    'Independent apps and real-time strategy games by Lizz Studio. Explore Never Sleep, Chop Farms and Clankerfront, and read notes from development.',
    render('index', {}, {
      posts: postList(listedPosts.slice(0, 5)),
      allPostsLink: listedPosts.length > 5 ? '<a class="all-posts-link" href="/blog">All posts</a>' : '',
    }), 'home');
  add('/blog', 'Blog — Lizz Studio',
    'Notes from Lizz on building independent apps, real-time strategy games and the tools behind them.',
    render('blog', {}, { posts: postList(listedPosts, 2) }), 'blog');
  add('/about', 'About Lizz Studio',
    'Lizz is the developer behind Lizz Studio, building independent apps and real-time strategy games.',
    render('about'), 'about');
  for (const post of posts) {
    add('/blog/' + post.slug, post.title + ' — Lizz Studio', post.excerpt || post.title,
      render('post', post, { body: post.body }), 'blog', post);
  }
  add('/404', 'Page not found — Lizz Studio', 'This page could not be found.', render('not-found'));
  return pages;
}

export function createFeed(posts) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>' +
    '<title>Lizz Studio blog</title><link>' + origin + '/blog</link>' +
    '<description>Notes on building apps, games and the tools behind them.</description><language>en</language>' +
    '<atom:link href="' + origin + '/feed.xml" rel="self" type="application/rss+xml"/>' +
    posts.filter(post => !post.unlisted).map(post => {
      const url = origin + '/blog/' + post.slug;
      return '<item><title>' + escapeHtml(post.title) + '</title><link>' + url +
        '</link><guid isPermaLink="true">' + url + '</guid><pubDate>' +
        new Date(post.date + 'T00:00:00Z').toUTCString() + '</pubDate><description>' +
        escapeHtml(post.excerpt) + '</description></item>';
    }).join('') + '</channel></rss>';
}
