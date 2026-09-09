import { decorateIcons, toClassName } from '../../scripts/aem.js';

/*
 * cards-capabilities — colored capability tiles.
 * Each authored row is two cells: the card content (linked title + description)
 * and a background-color name (e.g. "Dark Blue"). The arrow icon is baked in
 * (icons/cards-capabilities-arrow.svg) inside a colored panel on the right; the
 * color name becomes a per-tile class (e.g. dark-blue) — see cards-capabilities.css
 * and the DA config "cards-capabilities" options sheet for the supported set.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];

    // Content cell = the one that isn't a plain short color-name label and isn't
    // a legacy picture-only icon cell. Fall back to the first cell.
    const isIcon = (c) => c.children.length === 1 && c.querySelector('picture');
    const body = cells.find((c) => c.querySelector('h1, h2, h3, h4, h5, h6, p, a') && !isIcon(c))
      || cells[0];
    // Color cell = a remaining cell with just a short text label.
    const colorCell = cells.find((c) => c !== body && !isIcon(c));
    const colorName = colorCell ? toClassName(colorCell.textContent.trim()) : '';

    const li = document.createElement('li');
    if (colorName) li.classList.add(colorName);

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
