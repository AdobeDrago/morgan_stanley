import { decorateIcons } from '../../scripts/aem.js';

/*
 * cards-capabilities — colored capability tiles.
 * Authors provide one content cell per row (linked title + description). The
 * arrow icon is baked in (icons/cards-capabilities-arrow.svg), rendered inside
 * a colored panel on the right. Background color comes from a block option
 * class (e.g. `cards-capabilities (Dark Blue)` -> `.cards-capabilities.dark-blue`).
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    // Pick the content cell: the one that isn't a picture-only (legacy icon) cell.
    const cells = [...row.children];
    const body = cells.find((cell) => !(cell.children.length === 1 && cell.querySelector('picture')))
      || cells[cells.length - 1];

    const li = document.createElement('li');

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'cards-capabilities-card-body';
    while (body && body.firstChild) bodyDiv.append(body.firstChild);
    li.append(bodyDiv);

    // The card's link becomes the arrow's target. Prefer a standalone CTA link
    // (not the one inside the heading); remove its now-redundant paragraph so it
    // doesn't render as duplicate body text. Keep a heading link in place.
    const links = [...bodyDiv.querySelectorAll('a')];
    const cta = links.find((a) => !a.closest('h1, h2, h3, h4, h5, h6')) || links[0];
    const href = cta?.getAttribute('href');
    if (cta && !cta.closest('h1, h2, h3, h4, h5, h6')) (cta.closest('p') || cta).remove();

    // Colored panel on the right with the baked-in arrow, linking to the card.
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
    li.append(colorDiv);

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
  decorateIcons(block);
}
