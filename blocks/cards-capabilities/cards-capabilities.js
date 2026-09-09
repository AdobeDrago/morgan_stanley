import { decorateIcons, toClassName } from '../../scripts/aem.js';

/*
 * cards-capabilities — colored capability tiles.
 * Authored as key/value rows (so DA block-options autocomplete works):
 *   | content | <h3>title</h3><p>desc</p><p><a>link</a></p> |
 *   | color   | #672CB4                                     |
 * A `content` row starts a new card; subsequent keys (`color`) apply to it.
 * The `options` sheet offers `name=#hex` swatches; DA inserts the hex, so the
 * color cell is typically a hex value. applyColor() handles a hex/rgb value
 * (inline --tile-bg + auto light/dark text) or a bare class name (mapped in CSS).
 * The arrow icon is baked in (icons/cards-capabilities-arrow.svg) inside a
 * colored panel on the right.
 */

// Relative luminance of a #rgb/#rrggbb color (0 = black, 1 = white).
function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Apply an authored color to a tile: a hex/rgb value becomes an inline
// --tile-bg with auto-contrasting text; anything else is treated as a class.
function applyColor(li, raw) {
  if (!raw) return;
  const isColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) || /^rgb/i.test(raw);
  if (isColor) {
    li.style.setProperty('--tile-bg', raw);
    const dark = raw.startsWith('#') ? luminance(raw) < 0.5 : true;
    li.style.setProperty('--tile-fg', dark ? '#fff' : 'var(--text-color)');
  } else {
    li.classList.add(toClassName(raw));
  }
}
export default function decorate(block) {
  const ul = document.createElement('ul');
  let li = null;

  const finishArrow = (bodyDiv, listItem) => {
    // The card's link becomes the arrow target; drop its redundant paragraph.
    const links = [...bodyDiv.querySelectorAll('a')];
    const cta = links.find((a) => !a.closest('h1, h2, h3, h4, h5, h6')) || links[0];
    const href = cta?.getAttribute('href');
    if (cta && !cta.closest('h1, h2, h3, h4, h5, h6')) (cta.closest('p') || cta).remove();

    const colorDiv = document.createElement('div');
    colorDiv.className = 'cards-capabilities-card-color';
    const arrow = document.createElement(href ? 'a' : 'span');
    arrow.className = 'cards-capabilities-arrow';
    if (href) {
      arrow.href = href;
      arrow.setAttribute('aria-hidden', 'true');
      arrow.setAttribute('tabindex', '-1');
    }
    const icon = document.createElement('span');
    icon.className = 'icon icon-cards-capabilities-arrow';
    arrow.append(icon);
    colorDiv.append(arrow);
    listItem.append(colorDiv);
  };

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = toClassName(cells[0]?.textContent.trim() || '');
    const valueCell = cells[1];

    if (key === 'content' || (!li && key !== 'color')) {
      // Start a new card. (The `!li` fallback tolerates a missing key on the
      // first content row.)
      if (li) { finishArrow(li.querySelector('.cards-capabilities-card-body'), li); ul.append(li); }
      li = document.createElement('li');
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'cards-capabilities-card-body';
      const source = valueCell || cells[0];
      while (source && source.firstChild) bodyDiv.append(source.firstChild);
      li.append(bodyDiv);
    } else if (key === 'color' && li) {
      const raw = (valueCell || cells[cells.length - 1])?.textContent.trim() || '';
      applyColor(li, raw);
    }
  });

  // Flush the final card.
  if (li) { finishArrow(li.querySelector('.cards-capabilities-card-body'), li); ul.append(li); }

  block.textContent = '';
  block.append(ul);
  decorateIcons(block);
}
