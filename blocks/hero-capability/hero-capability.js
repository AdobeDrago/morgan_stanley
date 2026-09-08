export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
  // Per-capability brand panel colour: production themes each capability hero a
  // distinct brand colour (equity=navy, alternatives=blue, crypto=purple,
  // fixed-income & solutions=light). That colour is a design attribute of the
  // page, so tag the block with the page slug and theme it in CSS.
  const slug = window.location.pathname.split('/').filter(Boolean).pop();
  if (slug) block.classList.add(`hero-capability--${slug}`);
}
