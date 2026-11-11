import { readdirSync, readFileSync } from 'node:fs';
import { Marked } from 'marked';
import { parseFragment, serialize } from 'parse5';

const markdown = new Marked();
const sentences = new Intl.Segmenter('en', { granularity: 'sentence' });
const unlistedMarker = /^\s*<!--\s*unlisted\s*-->\s*/;

const nonTextElements = new Set(['script', 'style', 'template', 'noscript']);
const textBreaks = new Set(['br', 'p', 'div', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function excludesText(node) {
  return nonTextElements.has(node.tagName) || node.attrs?.some(attribute => attribute.name === 'hidden');
}

function textContent(node) {
  if (excludesText(node)) return '';
  if (node.nodeName === '#text') return node.value;
  if (node.tagName === 'img') return node.attrs.find(attribute => attribute.name === 'alt')?.value ?? '';
  const text = (node.childNodes ?? []).map(textContent).join('');
  return textBreaks.has(node.tagName) ? text + ' ' : text;
}

function plainText(node) {
  return textContent(node).replace(/\s+/g, ' ').trim();
}

function articleContent(tokens) {
  const tree = parseFragment(markdown.parser(tokens));
  const paragraphs = [];
  function visit(node, hidden = false) {
    // Normalize actual headings, including trusted HTML, without touching code text.
    if (node.tagName === 'h1') node.tagName = node.nodeName = 'h2';
    hidden = hidden || excludesText(node);
    if (!hidden && node.tagName === 'p' && paragraphs.length < 3) {
      const text = plainText(node);
      if (text) paragraphs.push(text);
    }
    for (const child of node.childNodes ?? []) visit(child, hidden);
  }
  visit(tree);
  return { body: serialize(tree), paragraphs };
}

function shorten(text, limit) {
  // Avoid cutting a surrogate pair when the character budget ends inside an emoji.
  return text.length > limit ? text.slice(0, limit - 1).replace(/[\uD800-\uDBFF]$/, '').replace(/\s+\S*$/, '') + '…' : text;
}

export function loadPosts(directory = new URL('./content/posts/', import.meta.url)) {
  const slugs = new Set();
  return readdirSync(directory).filter(name => name.endsWith('.md')).map(name => {
    const match = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/.exec(name);
    if (!match) throw new Error(`Invalid post filename: ${name}`);
    const [, date, slug] = match;
    const timestamp = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(timestamp.valueOf()) || timestamp.toISOString().slice(0, 10) !== date) {
      throw new Error(`Invalid post date: ${name}`);
    }
    if (slugs.has(slug)) throw new Error(`Duplicate post slug: ${slug}`);
    slugs.add(slug);
    const source = readFileSync(new URL(name, directory), 'utf8').replace(/\r\n/g, '\n');
    const unlisted = unlistedMarker.test(source);
    const tokens = markdown.lexer(source.replace(unlistedMarker, ''));
    const headingIndex = tokens.findIndex(token => token.type === 'heading' && token.depth === 1);
    const fallbackTitle = slug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
    const title = headingIndex >= 0
      ? plainText(parseFragment(markdown.parser([tokens.splice(headingIndex, 1)[0]]))) || fallbackTitle
      : fallbackTitle;
    const { body, paragraphs } = articleContent(tokens);
    const excerpt = shorten(paragraphs[0] ?? '', 200);
    const opening = [...sentences.segment(paragraphs.join(' '))].slice(0, 3)
      .map(sentence => sentence.segment).join('').trim();
    const preview = shorten(opening, 420);
    return {
      slug, title, date, excerpt, preview, unlisted,
      formattedDate: new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      }).format(timestamp),
      body,
    };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
