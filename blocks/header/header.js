import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Collapse every open top-level mega-menu.
 * @param {Element} navSections the .nav-sections container
 * @param {Element} [except] optional item to leave open
 */
function closeAllSections(navSections, except) {
  if (!navSections) return;
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
    if (li !== except) li.setAttribute('aria-expanded', 'false');
  });
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  const navSections = nav?.querySelector('.nav-sections');
  if (!navSections) return;
  const open = navSections.querySelector(':scope .default-content-wrapper > ul > li[aria-expanded="true"]');
  if (open) {
    closeAllSections(navSections);
    open.querySelector(':scope > button, :scope > a')?.focus();
  } else if (!isDesktop.matches) {
    // eslint-disable-next-line no-use-before-define
    toggleMenu(nav, navSections);
    nav.querySelector('.nav-hamburger button')?.focus();
  }
}

// close any open mega-menu when clicking/focusing outside the nav
function closeOnOutsideInteraction(e) {
  const nav = document.getElementById('nav');
  if (!nav) return;
  if (!nav.contains(e.target)) {
    closeAllSections(nav.querySelector('.nav-sections'));
    nav.querySelectorAll('.nav-tools .nav-tool-drop[aria-expanded="true"]').forEach((li) => li.setAttribute('aria-expanded', 'false'));
  }
}

/**
 * Toggle a single top-level section (mega-menu). Single-open: closes the others.
 * @param {Element} li the top-level list item
 * @param {Element} navSections the .nav-sections container
 */
function toggleSection(li, navSections) {
  const wasOpen = li.getAttribute('aria-expanded') === 'true';
  closeAllSections(navSections);
  li.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
}

/**
 * Toggles the entire nav (mobile hamburger)
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  closeAllSections(navSections);
  button?.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Wrap a top-level li's label (a bare text node or leading <p>) in a
 * <button class="nav-drop-label"> trigger so it can carry click/keyboard
 * handlers and the active underline.
 * @returns {HTMLButtonElement|null}
 */
function buildTrigger(li) {
  const nestedList = li.querySelector(':scope > ul');
  if (!nestedList) return null;

  // The label may be a bare text node or wrapped in a <p> before the nested <ul>.
  // Ignore whitespace-only text nodes; take the first meaningful label source.
  let label = '';
  const leadingP = [...li.children].find((c) => c.tagName === 'P');
  if (leadingP && !li.querySelector(':scope > .nav-drop-label')) {
    label = leadingP.textContent.trim();
    leadingP.remove();
  } else {
    // fall back to leading text nodes
    [...li.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim() && !label) {
        label = n.textContent.trim();
      }
      if (n.nodeType === Node.TEXT_NODE) n.remove();
    });
  }
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-drop-label';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.textContent = label;
  li.prepend(trigger);
  return trigger;
}

/**
 * Decorate a top-level mega-menu panel: left link column + optional right
 * FEATURED promo card (mirrors production).
 * @param {Element} li top-level item
 * @param {string} label its text label
 */
function decoratePanel(li, label) {
  const list = li.querySelector(':scope > ul');
  if (!list) return;

  const panel = document.createElement('div');
  panel.className = 'nav-megamenu';

  const left = document.createElement('div');
  left.className = 'nav-megamenu-links';
  left.append(list);
  panel.append(left);

  const key = label.trim().toLowerCase();
  const featured = {
    capabilities: {
      variant: 'navy',
      img: '/media-da/59f033c687c178b6715244ada69e2353.jpg',
      title: 'Crypto, Built Into Your Portfolio',
      body: 'Access a cost-efficient, exchange-traded way to gain crypto exposure.',
      href: '/im/en-us/individual-investor/capabilities/crypto',
    },
    insights: {
      variant: 'purple',
      title: 'The BEAT™',
      body: 'Help clients understand and unlock the value in today’s markets.',
      href: 'https://www.morganstanley.com/im/en-us/individual-investor/insights/series/the-beat.html',
    },
  };
  const promo = featured[key];
  if (promo) {
    const card = document.createElement('a');
    card.className = `nav-megamenu-featured nav-megamenu-featured-${promo.variant}`;
    card.href = promo.href;
    card.innerHTML = `<span class="nav-megamenu-featured-body">
        <span class="nav-megamenu-featured-eyebrow">FEATURED</span>
        ${promo.img ? `<span class="nav-megamenu-featured-img"><img src="${promo.img}" alt="" loading="lazy"></span>` : ''}
        <span class="nav-megamenu-featured-title">${promo.title}</span>
        <span class="nav-megamenu-featured-text">${promo.body}</span>
      </span>`;
    panel.append(card);
  }

  // Products: static, on-brand fund-card placeholder (no live market data).
  if (key === 'products') {
    const ph = document.createElement('div');
    ph.className = 'nav-megamenu-featured nav-megamenu-featured-navy nav-megamenu-funds';
    ph.setAttribute('aria-hidden', 'true');
    ph.innerHTML = '<span class="nav-fund-card"></span><span class="nav-fund-card"></span><span class="nav-fund-card"></span>';
    panel.append(ph);
    left.classList.add('nav-megamenu-links-selectable');
  }

  li.append(panel);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const label = navSection.textContent.trim().split('\n')[0].trim();
      if (navSection.querySelector(':scope > ul')) {
        navSection.classList.add('nav-drop');
        const trigger = buildTrigger(navSection);
        decoratePanel(navSection, label);
        trigger?.addEventListener('click', (e) => {
          if (!isDesktop.matches) return;
          if (e.target.closest('.nav-megamenu')) return; // let child links navigate
          e.preventDefault();
          e.stopPropagation();
          toggleSection(navSection, navSections);
        });
      }
    });
  }

  // utility tools dropdowns (country selector, Account Access) + search
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    navTools.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
      if (li.querySelector(':scope > ul')) {
        li.classList.add('nav-tool-drop');
        const trigger = buildTrigger(li);
        trigger?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const open = li.getAttribute('aria-expanded') === 'true';
          navTools.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((o) => o.setAttribute('aria-expanded', 'false'));
          li.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      }
    });

    const search = document.createElement('button');
    search.type = 'button';
    search.className = 'nav-search';
    search.setAttribute('aria-label', 'Search');
    navTools.append(search);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // close on outside click / Escape (desktop mega-menu)
  document.addEventListener('click', closeOnOutsideInteraction);
  window.addEventListener('keydown', closeOnEscape);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
