/*
 * widget-placeholder
 *
 * On-brand stand-in for the production dynamic product-search + fund-quote widget.
 * The live widget could not be migrated as a dynamic component, so the section is
 * authored statically: a (non-interactive) product-search bar plus a set of fund
 * quote cards whose values are HARD-CODED in the document (a point-in-time
 * snapshot the author maintains) — not fetched live.
 *
 * Authoring model (block rows):
 *   Row 1  (search bar):  | <label> | <search placeholder> |
 *   Row 2+ (fund cards):  | ticker•class | fund name | NAV-as-of label | price | up|down |
 *
 * The direction cell ("up"/"down") controls the arrow before the price; anything
 * other than "up" renders a down arrow. All cells are optional/defensive.
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  block.textContent = '';

  // --- Row 1: product-search bar ---
  const searchRow = rows.shift();
  const searchCells = searchRow ? [...searchRow.children] : [];
  const label = (searchCells[0]?.textContent || 'Products').trim();
  const placeholder = (searchCells[1]?.textContent || 'Search a product').trim();

  const search = document.createElement('div');
  search.className = 'widget-placeholder-search';
  search.innerHTML = `
    <span class="widget-placeholder-label">${label}</span>
    <div class="widget-placeholder-field">
      <span class="widget-placeholder-input">${placeholder}</span>
      <button type="button" class="widget-placeholder-search-btn" aria-label="Search">
        <span class="widget-placeholder-icon" aria-hidden="true"></span>
      </button>
    </div>`;
  block.append(search);

  // --- Row 2+: fund quote cards (hard-coded snapshot values) ---
  const cards = document.createElement('div');
  cards.className = 'widget-placeholder-funds';

  rows.forEach((row) => {
    const c = [...row.children];
    if (!c.length) return;
    const ticker = (c[0]?.textContent || '').trim();
    const name = (c[1]?.textContent || '').trim();
    const navDate = (c[2]?.textContent || '').trim();
    const price = (c[3]?.textContent || '').trim();
    const direction = (c[4]?.textContent || 'down').trim().toLowerCase();
    const isUp = direction === 'up';

    const card = document.createElement('div');
    card.className = 'widget-placeholder-fund';
    card.innerHTML = `
      <span class="widget-placeholder-fund-ticker">${ticker}</span>
      <span class="widget-placeholder-fund-name">${name}</span>
      <span class="widget-placeholder-fund-navdate">${navDate}</span>
      <span class="widget-placeholder-fund-nav">
        <span class="widget-placeholder-fund-arrow ${isUp ? 'is-up' : 'is-down'}" aria-hidden="true"></span>
        <span class="widget-placeholder-fund-price">${price}</span>
      </span>`;
    cards.append(card);
  });

  if (cards.children.length) block.append(cards);
}
