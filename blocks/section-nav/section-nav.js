/*
 * section-nav — in-page sticky tab strip (capability pages).
 * Production renders a row of anchor tabs (Overview / Differentiators / …) with
 * a teal active underline that sticks to the top of the viewport on scroll and
 * highlights the section currently in view (scroll-spy).
 *
 * Authoring model — one row per tab, each a link whose href is the section
 * anchor (e.g. #overview):
 *   | Overview        | #overview        |
 *   | Differentiators | #key-differentiators |
 * The label cell is optional; if only a link is given its text is the label.
 */
export default function decorate(block) {
  const tabs = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const link = row.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : (cells[1]?.textContent || '').trim();
    const label = (cells[0]?.textContent || (link ? link.textContent : '')).trim();
    if (!href || !label) return;
    tabs.push({ label, id: href.replace(/^.*#/, '') });
  });

  const nav = document.createElement('nav');
  nav.className = 'section-nav-tabs';
  nav.setAttribute('aria-label', 'Section navigation');
  nav.innerHTML = tabs.map((t) => `<a href="#${t.id}" data-target="${t.id}">${t.label}</a>`).join('');
  block.textContent = '';
  block.append(nav);

  const links = [...nav.querySelectorAll('a')];
  const targets = tabs.map((t) => document.getElementById(t.id)).filter(Boolean);

  // The site header is a fixed, two-row bar whose real height is not the 64px
  // --nav-height. Measure the actual fixed header and pin the sticky bar right
  // below it (via --section-nav-top), so there is no gap at the top and no
  // overlap. Re-measure on resize (the header height changes across breakpoints).
  const section = block.closest('.section') || block;
  const syncOffset = () => {
    const header = document.querySelector('header .nav-wrapper')
      || document.querySelector('header');
    const h = header ? Math.round(header.getBoundingClientRect().height) : 64;
    section.style.setProperty('--section-nav-top', `${h}px`);
  };
  syncOffset();
  window.addEventListener('resize', syncOffset);
  window.addEventListener('load', syncOffset);

  // smooth scroll, accounting for the fixed header + this sticky bar's height
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = document.getElementById(a.dataset.target);
      if (!el) return;
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(section)
        .getPropertyValue('--section-nav-top'), 10) || 64;
      const offset = nav.getBoundingClientRect().height + headerH;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // scroll-spy: mark the tab whose section is currently in view
  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.target === id));
  };
  if (targets.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((en) => en.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] });
    targets.forEach((t) => observer.observe(t));
    setActive(tabs[0].id);
  }
}
