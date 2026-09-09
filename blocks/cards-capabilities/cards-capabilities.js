import { decorateIcons, toClassName } from '../../scripts/aem.js';

/*
 * cards-capabilities — colored capability tiles.
 * Authored as key/value rows (so DA block-options autocomplete works):
 *   | content | <h3>title</h3><p>desc</p><p><a>link</a></p> |
 *   | color   | Dark Blue                                   |
 * A `content` row starts a new card; subsequent keys (`color`) apply to it.
 * The arrow icon is baked in (icons/cards-capabilities-arrow.svg) inside a
 * colored panel on the right; the color name becomes a per-card class
 * (see cards-capabilities.css and the DA config `options` sheet).
 */
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
      const name = toClassName((valueCell || cells[cells.length - 1])?.textContent.trim() || '');
      if (name) li.classList.add(name);
    }
  });

  // Flush the final card.
  if (li) { finishArrow(li.querySelector('.cards-capabilities-card-body'), li); ul.append(li); }

  block.textContent = '';
  block.append(ul);
  decorateIcons(block);
}
