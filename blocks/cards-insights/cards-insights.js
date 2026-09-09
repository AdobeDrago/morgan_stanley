import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-insights — Featured Insights cards.
 * Authored by REFERENCE: each row holds an insight path (e.g.
 * /insights/consilient-observer/…). The block resolves each path against
 * /insights.json and renders the card (image, series eyebrow, title,
 * description, date, doc-icon link). Falls back to a humanized title when a
 * path isn't indexed.
 */

// Memoized index fetch.
let insightsPromise;
async function fetchInsights() {
  if (!insightsPromise) {
    insightsPromise = fetch('/insights.json')
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return insightsPromise;
}

function humanize(path) {
  const slug = path.split('/').filter(Boolean).pop() || path;
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY',
  'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return iso || '';
  const [, y, mo, d] = m;
  return MONTHS[Number(mo) - 1] ? `${d} ${MONTHS[Number(mo) - 1]} ${y}` : iso;
}

function buildCard(path, row) {
  const li = document.createElement('li');

  // image
  if (row && row.image) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'cards-insights-card-image';
    imageDiv.append(createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]));
    li.append(imageDiv);
  }

  // body: eyebrow(series), title, description, date, doc-icon link
  const body = document.createElement('div');
  body.className = 'cards-insights-card-body';

  const eyebrow = document.createElement('p');
  eyebrow.textContent = row && row.series ? row.series : '';
  body.append(eyebrow);

  const title = document.createElement('h3');
  title.textContent = row && row.title ? row.title : humanize(path);
  body.append(title);

  const desc = document.createElement('p');
  desc.textContent = row && row.description ? row.description : '';
  body.append(desc);

  const date = document.createElement('p');
  date.textContent = row && row['publication-date'] ? formatDate(row['publication-date']) : '';
  body.append(date);

  const linkP = document.createElement('p');
  const link = document.createElement('a');
  link.href = path;
  link.setAttribute('aria-label', row && row.title ? row.title : humanize(path));
  linkP.append(link);
  body.append(linkP);

  li.append(body);
  return li;
}

export default function decorate(block) {
  // Collect authored insight paths (one per row; tolerate a link or plain text).
  const paths = [...block.children].map((row) => {
    const a = row.querySelector('a');
    return (a ? a.getAttribute('href') : row.textContent).trim();
  }).filter(Boolean);

  const ul = document.createElement('ul');
  block.textContent = '';
  block.append(ul);

  fetchInsights().then((rows) => {
    paths.forEach((path) => {
      const row = rows.find((r) => r.path === path);
      ul.append(buildCard(path, row));
    });
  });
}
