import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

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

async function renderByline(paths) {
  const byline = document.createElement('div');
  byline.className = 'article-byline';
  const rows = await fetchIndex('/authors.json');
  paths.forEach((path) => {
    const row = findRow(rows, path);
    const link = document.createElement('a');
    link.className = 'article-author';
    link.href = path;
    if (row && row.image) {
      const pic = createOptimizedPicture(row.image, row.title || '', false, [{ width: '80' }]);
      pic.classList.add('article-author-photo');
      link.append(pic);
    }
    const meta = document.createElement('span');
    meta.className = 'article-author-meta';
    const name = document.createElement('span');
    name.className = 'article-author-name';
    name.textContent = row && row.title ? row.title : humanize(path);
    meta.append(name);
    if (row && row.role) {
      const role = document.createElement('span');
      role.className = 'article-author-role';
      role.textContent = row.role;
      meta.append(role);
    }
    link.append(meta);
    byline.append(link);
  });
  return byline;
}

async function renderRelated(paths) {
  const rows = await fetchIndex('/insights.json');
  const section = document.createElement('div');
  section.className = 'article-related';
  const heading = document.createElement('h2');
  heading.textContent = 'Related Insights';
  section.append(heading);
  const ul = document.createElement('ul');
  ul.className = 'cards'; // reuse cards block styling
  paths.forEach((path) => {
    const row = findRow(rows, path);
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = path;
    if (row && row.image) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'cards-card-image';
      imgDiv.append(createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]));
      link.append(imgDiv);
    }
    const body = document.createElement('div');
    body.className = 'cards-card-body';
    if (row && row.series) {
      const series = document.createElement('p');
      series.className = 'article-related-series';
      series.textContent = row.series;
      body.append(series);
    }
    const title = document.createElement('p');
    title.className = 'article-related-title';
    title.textContent = row && row.title ? row.title : humanize(path);
    body.append(title);
    if (row && row['publication-date']) {
      const date = document.createElement('p');
      date.className = 'article-related-date';
      date.textContent = row['publication-date'];
      body.append(date);
    }
    link.append(body);
    li.append(link);
    ul.append(li);
  });
  section.append(ul);
  return section;
}

export default function decorate(block) {
  const title = getMetadata('title');
  const series = getMetadata('series');
  const date = getMetadata('publication-date');
  // The special `image` metadata key emits as og:image; fall back to a plain `image` meta.
  const image = getMetadata('og:image') || getMetadata('image');
  const authors = splitPaths(getMetadata('authors'));
  const related = splitPaths(getMetadata('related'));

  // Masthead (prepended, eager hero for LCP).
  const masthead = document.createElement('div');
  masthead.className = 'article-masthead';
  if (image) {
    const pic = createOptimizedPicture(image, title, true);
    pic.classList.add('article-hero');
    masthead.append(pic);
  }
  if (series) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'article-eyebrow';
    eyebrow.textContent = series;
    masthead.append(eyebrow);
  }
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    masthead.append(h1);
  }
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'article-date';
    dateEl.textContent = date;
    masthead.append(dateEl);
  }
  block.prepend(masthead);

  // Byline — inserted after masthead once the authors index resolves.
  if (authors.length) {
    renderByline(authors).then((byline) => masthead.append(byline));
  }

  // Related Insights — appended once the insights index resolves.
  if (related.length) {
    renderRelated(related).then((section) => block.append(section));
  }
}
