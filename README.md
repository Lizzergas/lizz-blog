# lizz.dev

Lizz Studio's portfolio and Markdown blog. Plain HTML and CSS, generated ahead of time by a small Node.js build script and served as static files by Cloudflare Workers Static Assets. There is no runtime server, frontend framework, database, web-font request, analytics or client-side router. Markdown and HTML parsers run only at build time to prepare article content and metadata.

## Run locally

Use **Node.js 24 LTS** (also specified in .nvmrc).

```sh
npm ci
npm run dev    # builds dist/ and serves it with wrangler dev on http://localhost:8080
npm test
```

npm run dev uses Cloudflare's real asset routing, _headers and 404 handling, and rebuilds when content, views, public files or the build scripts change. npm run build writes dist/ without serving it.

## Structure and design

- views/layout.html: studio topbar with Blog/About navigation, studio description, contact footer and metadata.
- views/index.html: projects and recent writing.
- views/blog.html: the complete writing index at /blog.
- views/post.html: article layout. The published /blog/hello-world-old URL is preserved.
- views/about.html: the retained /about page.
- public/style.css: the dark slate layout, with a round gecko icon and navigation in the topbar, a short studio description, project tabs, a contact footer and responsive phone layout. Category panels use a restrained 180ms fade and vertical transition. On hover-capable fine pointers, project icons smoothly scale up 6% on hover or keyboard focus and return when leaving. Both effects respect reduced motion.
- public/images/: local WebP icons at normal and double resolution, plus the static Forest edge background.
- No page ships executable JavaScript. Article copying has been removed.
- content/posts/: trusted Markdown posts.
- site.js: template rendering, per-page metadata, structured data and RSS.
- build.js: writes every page, robots.txt, sitemap.xml, feed.xml, the public assets and Cloudflare's _headers into dist/.
- wrangler.jsonc: the static-assets Worker, clean URLs, 404 handling and the lizz.dev/www.lizz.dev custom domains.
- test/site.test.js: build output, metadata, headers, Wrangler configuration and Markdown regression tests.

Projects are split into Games and Apps tabs. Games is selected by default and shows Chop Farms followed by Clankerfront; Apps shows Never Sleep followed by NX Block Reason, a Chrome extension linked to its Chrome Web Store page, in the same icon, name, one-line description and link format with no status label. Native radio controls and CSS provide switching, animation and keyboard support without JavaScript. Both panels share one grid cell so writing below them stays in place while switching; the inactive panel cannot receive focus. Clankerfront's image is preconverted to grayscale and its text is muted. Status labels sit below each game's description: muted green In development for Chop Farms, muted amber Paused for Clankerfront. The words also communicate status without relying on color.

The approved reference is concepts/studio-portfolio-2026-11/04-combined-dark-slate.png. Concept files are not copied into dist/ or published. Blog and About sit in the topbar; the studio mark links home, so there is no redundant Work link. Contact, email and the X/YouTube icons sit in a compact footer after the content. Phones show the studio description followed directly by Projects. The same social profiles remain in Organization structured data. There is no GitHub link or redundant introductory headline.

The X and YouTube links use icons only: a white X on black and a red YouTube button with a white play triangle. The inline SVGs are 24px inside 44px touch targets. Each link keeps an aria-label; decorative icons are hidden from assistive technology and cannot receive focus. They require no additional image requests or dependencies. Brand references: https://about.x.com/en/who-we-are/brand-toolkit and https://brand.youtube/.

### Assets

The studio mark and Chop Farms icon come from the ChopFarmsRTS press kit and app assets. Never Sleep uses its existing landing-site icon; NX Block Reason uses its extension icon (from the nx-block-reason repository) rendered full-bleed so the site's CSS rounds it like the others; Clankerfront uses its public battle screenshot. Optimized production copies are committed under public/; the original sibling repositories are not needed to run or deploy this site.

The favicon set includes multi-size ICO, PNG, Apple touch icon, 192/512 PNG icons and a web manifest. A real 1200×630 JPEG provides social previews. The studio mark is circular in the UI and favicon images.

The approved Forest edge concept is concepts/background-studies-2026-11/03-forest-edge.png. Its background-only artwork was generated with the built-in image tool, then optimized to public/images/forest-edge.webp. The source and full generation prompt are saved in concepts/forest-edge-implementation-2026-11/. A non-interactive fixed CSS layer anchors the illustration to the visible screen, so trees are present before scrolling and add no page height. It avoids mobile Safari's background-attachment: fixed behavior. Phone screens use a smaller, quieter grove on the right; shorter desktop windows use tighter vertical spacing. It adds no scripts, animation or layout shift.

After changing an existing deployed asset, bump its version query wherever it is referenced, including metadata/social image URLs. Images use short caching plus ETags; they do not claim immutable URLs.

## Publishing posts

Create content/posts/YYYY-MM-DD-your-post-slug.md:

```md
# My post title

A short opening paragraph, also used as the description and RSS excerpt.

## More detail

Write the rest in Markdown.
```

The filename supplies the publication date and /blog/your-post-slug URL. The first top-level Markdown H1 supplies the title and is removed from the body. Titles and previews use readable text from parsed HTML, preserving code identifiers and decoding character references. Remaining Markdown and authored HTML H1s become H2 section headings, including in blockquotes and lists, so the page has one article H1. Literal headings in code examples stay intact. Without a non-empty top-level Markdown H1, the title is derived from the slug. Invalid dates/filenames and duplicate slugs fail the build.

The home page shows the latest five listed post previews under Blog, with All posts when there are more. Each preview shows the first three opening sentences (up to 420 characters) and links to the full article. /blog and /feed.xml contain listed posts. Pages, sitemap and feed are generated by the build, so deploy after publishing. npm run dev rebuilds on change.

To delist a post without breaking its published URL, put `<!-- unlisted -->` at the start of its Markdown file, before the title. Unlisted posts remain readable at their URL with noindex metadata and are excluded from home/blog listings, RSS and the sitemap. This is delisting, not access control. Hello world is currently unlisted.

The title-only announcement stub is `content/posts/2026-11-10-announcing-lizz-studio.md`. Add the article text below its heading when ready. Empty previews are omitted; no placeholder copy is generated.

In blog listings, dates follow their titles with a 16px gap and smaller muted text, without a separator. The date wraps below the title when space is limited.

Markdown allows author-supplied HTML. Only commit trusted content; this is not a public Markdown submission service. Template values and JSON-LD strings are escaped, and CSP restricts script execution.

## SEO and HTTP behavior

All content and links are present in the initial HTML and readable without JavaScript. Pages have unique titles/descriptions, fixed https://lizz.dev canonical URLs, Open Graph/Twitter cards and schema.org Organization, WebSite and page/article data. Articles include the actual publication date and author. Social previews use the same studio image; article-specific artwork can be added later.

- /robots.txt allows crawling and points to /sitemap.xml.
- /sitemap.xml lists only canonical public HTML pages.
- /feed.xml is an RSS feed served as application/rss+xml, also linked in each page's head.
- Unknown routes return HTTP 404 with the noindex not-found page, without a canonical tag. The /404 path itself returns that page with 200; it is noindex and absent from the sitemap.
- Only files written to dist/ are public: generated pages, crawler files and the contents of public/. Source, content and concept files are never uploaded.
- Clean URLs: /blog is served from blog.html. Trailing-slash and .html URLs redirect (307) to the clean URL. GET/HEAD are supported; other methods receive 405.
- Cloudflare handles Brotli/gzip, ETags and conditional requests.
- HTML revalidates on every request (Cloudflare's default public, max-age=0, must-revalidate). Static assets cache for an hour; crawler files/feed cache for five minutes.
- A single site-wide CSP restricts resources to local assets, with no unsafe-inline or unsafe-eval. JSON-LD is a data block that browsers never execute, so it needs no script hash.
- Headers include HSTS, framing protection, nosniff, a referrer policy, same-origin resource policy and restricted browser permissions. The workers.dev preview host adds X-Robots-Tag: noindex.
- No cookies, forms, authentication or writable public endpoints are introduced.

Cloudflare's Email Address Obfuscation must stay off for the lizz.dev zone: it would rewrite the footer mailto link and inject a script.

## Validation

Run npm test under Node 24. The tests build dist/ into a temporary directory and cover public pages, retained article content/date, project categories, metadata/schema, the exact published file set, crawler files/RSS, the 404 page, _headers security and caching rules, the Wrangler asset configuration, hostile metadata escaping, Markdown/HTML heading normalization, readable titles/previews, entities, reference links and preserved code identifiers.

Browser evidence and the design review are generated under .taste-skill/ (ignored). The compact layout deliberately omits large hero media and footage. Check actual rendering, contrast, keyboard focus, narrow widths, no-JavaScript reading, preview navigation, category transitions and reduced-motion behavior when changing layout or CSP.

No deployment is implied by passing local tests.

## Deploy to Cloudflare Workers

The site is a static-assets-only Worker named **lizz-blog** on the same Cloudflare account as chopfarms.com, on the Free plan. wrangler is a pinned dev dependency; log in once with npx wrangler login.

```sh
npm ci
npm run deploy   # runs the tests, builds dist/ and uploads it with wrangler deploy
```

wrangler deploy also applies the lizz.dev and www.lizz.dev custom domains from wrangler.jsonc. The lizz.dev zone is active on Cloudflare; Hostinger remains the registrar and mail provider, and its MX, SPF, DKIM, DMARC and autodiscover/autoconfig records stay DNS only. Zone settings: a Redirect Rule (301) sends www.lizz.dev to https://lizz.dev with the path and query preserved, Always Use HTTPS is on, and Email Address Obfuscation is off.

Wrangler manages the Worker and its deploys. For everything else in the zone (DNS records, rules, settings), use the Cloudflare CLI, cf (npm install -g cf, then cf auth login); for example cf zones settings get always_use_https -z lizz.dev.

Verify after deployment:

```sh
curl -fsSI https://lizz.dev/
curl -fsS https://lizz.dev/robots.txt
curl -fsS https://lizz.dev/sitemap.xml
curl -fsSI https://www.lizz.dev/blog
```

Check /, /blog, /about and /blog/hello-world-old in a browser, plus the circular icon and social card. Roll back with npx wrangler rollback, or pick an earlier version under Workers & Pages > lizz-blog > Deployments.
