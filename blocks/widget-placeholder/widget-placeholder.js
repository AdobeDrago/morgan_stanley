/*
 * widget-placeholder
 *
 * Static, on-brand stand-in for the production dynamic widgets (product search +
 * live NAV fund quotes). Per the migration decision, live market data is NOT
 * snapshotted, and the reference component must not render as a "Page Not Found".
 * This renders a non-interactive product-search bar + fund-card frame so the
 * section reads on-brand without fabricating stale data.
 *
 * Authored content (optional): first cell = label (e.g. "Products"),
 * second cell = search placeholder text (e.g. "Search a product").
 */
export default function decorate(block) {
  const firstRow = block.querySelector(':scope > div');
  const cells = firstRow ? [...firstRow.children] : [];
  const label = (cells[0]?.textContent || 'Products').trim();
  const placeholder = (cells[1]?.textContent || 'Search a product').trim();

  block.textContent = '';

  const search = document.createElement('div');
  search.className = 'widget-placeholder-search';
  search.innerHTML = `
    <span class="widget-placeholder-label">${label}</span>
    <div class="widget-placeholder-field">
      <span class="widget-placeholder-input">${placeholder}</span>
      <span class="widget-placeholder-icon" aria-hidden="true"></span>
    </div>`;

  const frame = document.createElement('div');
  frame.className = 'widget-placeholder-frame';
  frame.setAttribute('aria-hidden', 'true');
  frame.innerHTML = `
    <div class="widget-placeholder-card"></div>
    <div class="widget-placeholder-card"></div>
    <div class="widget-placeholder-card"></div>`;

  block.append(search, frame);
}
