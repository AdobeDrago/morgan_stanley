import { createOptimizedPicture, decorateIcons, getMetadata } from '../../scripts/aem.js';

// Memoized index fetches — one network request per index, shared across blocks.
const indexCache = new Map();
async function fetchIndex(path) {
  if (!indexCache.has(path)) {
    indexCache.set(path, fetch(path)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []));
  }
  return indexCache.get(path);
}

// Split a comma-delimited metadata value into trimmed, non-empty paths.
function splitPaths(value) {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length);
}

function findRow(rows, path) {
  return rows.find((row) => row.path === path);
}

// Humanize a content path into a display label (fallback when no index row exists).
function humanize(path) {
  const slug = path.split('/').filter(Boolean).pop() || path;
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY',
  'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

// Format an ISO date (2026-09-01) as "01 SEPTEMBER 2026"; pass through on failure.
function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return iso;
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return iso;
  return `${d} ${month} ${y}`;
}

// Author byline — one link per author wrapping the name (bold, underlined)
// and, if present, the role (plain) on its own line. Resolved from /authors.json.
async function renderByline(paths) {
  const byline = document.createElement('div');
  byline.className = 'article-byline';
  const rows = await fetchIndex('/authors.json');
  paths.forEach((path) => {
    const row = findRow(rows, path);
    const link = document.createElement('a');
    link.className = 'article-author';
    link.href = path;

    const name = document.createElement('span');
    name.className = 'article-author-name';
    name.textContent = row && row.title ? row.title : humanize(path);
    link.append(name);

    if (row && row.role) {
      const role = document.createElement('span');
      role.className = 'article-author-role';
      role.textContent = row.role;
      link.append(role);
    }
    byline.append(link);
  });
  return byline;
}

async function renderFeatured(paths) {
  const rows = await fetchIndex('/insights.json');
  const section = document.createElement('div');
  section.className = 'article-featured';
  const heading = document.createElement('h2');
  heading.textContent = 'Featured Insights';
  section.append(heading);
  const ul = document.createElement('ul');
  ul.className = 'article-featured-cards';
  paths.forEach((path) => {
    const row = findRow(rows, path);
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'article-featured-card';
    link.href = path;

    // image
    if (row && row.image) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'article-featured-image';
      imgDiv.append(createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]));
      link.append(imgDiv);
    }

    // body: series, title, description
    const body = document.createElement('div');
    body.className = 'article-featured-body';
    if (row && row.series) {
      const series = document.createElement('p');
      series.className = 'article-featured-series';
      series.textContent = row.series;
      body.append(series);
    }
    const title = document.createElement('p');
    title.className = 'article-featured-title';
    title.textContent = row && row.title ? row.title : humanize(path);
    body.append(title);
    if (row && row.description) {
      const desc = document.createElement('p');
      desc.className = 'article-featured-desc';
      desc.textContent = row.description;
      body.append(desc);
    }
    link.append(body);

    // footer: date + article icon
    const footer = document.createElement('div');
    footer.className = 'article-featured-footer';
    if (row && row['publication-date']) {
      const date = document.createElement('p');
      date.className = 'article-featured-date';
      date.textContent = formatDate(row['publication-date']);
      footer.append(date);
    }
    const icon = document.createElement('span');
    icon.className = 'icon icon-article article-featured-icon';
    footer.append(icon);
    link.append(footer);

    li.append(link);
    ul.append(li);
  });
  section.append(ul);
  return section;
}

export default function decorate(block) {
  // The `title` metadata key becomes <title>/og:title, not a name="title" meta.
  const title = getMetadata('og:title') || document.title;
  const series = getMetadata('series');
  const date = getMetadata('publication-date');
  // The special `image` metadata key emits as og:image; fall back to a plain `image` meta.
  const image = getMetadata('og:image') || getMetadata('image');
  const authors = splitPaths(getMetadata('authors'));
  const related = splitPaths(getMetadata('related'));

  // Three-panel hero masthead. DOM order (media, text, authors) is the mobile
  // stack; desktop reorders via grid-template-areas.
  const masthead = document.createElement('div');
  masthead.className = 'article-masthead';

  // Media panel (eager hero for LCP). Request the DAM "Small" smart-crop
  // rendition. A plain <img> is used instead of createOptimizedPicture because
  // the latter rebuilds the URL from origin+pathname and drops the query string.
  if (image) {
    const media = document.createElement('div');
    media.className = 'article-hero-media';
    const img = document.createElement('img');
    img.src = `${image}${image.includes('?') ? '&' : '?'}smartcrop=Small`;
    img.alt = title;
    img.loading = 'eager';
    media.append(img);
    masthead.append(media);
  }

  // Text panel (navy): eyebrow, title, date.
  const text = document.createElement('div');
  text.className = 'article-hero-text';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'article-eyebrow';
  eyebrow.textContent = series ? `${series} | Insights` : 'Insights';
  text.append(eyebrow);
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    text.append(h1);
  }
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'article-date';
    dateEl.textContent = formatDate(date);
    text.append(dateEl);
  }
  masthead.append(text);

  // Authors panel (blue): heading + byline.
  if (authors.length) {
    const authorsPanel = document.createElement('div');
    authorsPanel.className = 'article-hero-authors';
    const authorsHeading = document.createElement('p');
    authorsHeading.className = 'article-authors-heading';
    authorsHeading.textContent = 'The Authors';
    authorsPanel.append(authorsHeading);
    masthead.append(authorsPanel);
    renderByline(authors).then((byline) => authorsPanel.append(byline));
  }

  block.prepend(masthead);

  // Featured Insights — appended once the insights index resolves.
  if (related.length) {
    renderFeatured(related).then((section) => {
      block.append(section);
      decorateIcons(section);
    });
  }
}
