#!/usr/bin/env node
/*
 * plain-to-da.js — convert a block-formatted EDS ".plain.html" (the DELIVERED shape:
 * <div class="blockname"><div><div>cell</div></div></div>) into Document Authoring
 * SOURCE html (block <table>s + <hr> section separators), then optionally POST to DA.
 *
 * The earlier migration mistakenly uploaded the delivered .plain.html straight to DA,
 * which strips the block wrappers (DA stores blocks as tables). This produces the
 * correct DA source so the page renders from blocks (data-block-name) on delivery.
 *
 * Usage:
 *   node plain-to-da.js <input.plain.html> [--out <file.html>] [--upload <org/repo/path>]
 *
 * Structure rules (mirrors helix-importer DOMUtils.createTable):
 *  - Top-level <main> has one or more <div> "sections". Multiple sections => separated by <hr>.
 *  - A block <div class="name a b"> becomes:
 *        <table><tr><th>Name A B</th></tr>  (header = block name, spaces from hyphens, title case-ish)
 *        then one <tr> per direct child row div, one <td> per cell div.
 *  - section-metadata / metadata blocks convert to their standard tables too.
 *  - Everything else (headings, paragraphs, pictures) is emitted as-is (default content).
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const args = process.argv.slice(2);
const input = args[0];
if (!input) {
  console.error('Usage: node plain-to-da.js <input.plain.html> [--out file] [--upload org/repo/path]');
  process.exit(1);
}
const outIdx = args.indexOf('--out');
const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
const upIdx = args.indexOf('--upload');
const uploadTarget = upIdx >= 0 ? args[upIdx + 1] : null;
// --media-base rewrites root-relative /media-da/ (and ./media-da/) refs to an
// absolute URL so DA's html2md can fetch+ingest them at authoring time. Without
// this, DA cannot resolve the relative path and emits an `about:error` placeholder.
const mbIdx = args.indexOf('--media-base');
const mediaBase = mbIdx >= 0 ? args[mbIdx + 1].replace(/\/$/, '') : null;

let html = fs.readFileSync(input, 'utf-8');
if (mediaBase) {
  html = html
    .replace(/(["'(])\.?\/media-da\//g, `$1${mediaBase}/media-da/`);
}
const dom = new JSDOM(html);
const { document } = dom.window;

// Turn "cards-capabilities" / "section-metadata" class into a header label.
function blockNameFromClasses(classes) {
  // classes like ["cards-capabilities"] or ["columns","variant"]
  return classes
    .map((c) => c.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' '))
    .join(' ')
    .trim();
}

function createTable(rows, header) {
  const table = document.createElement('table');
  let maxCols = 1;
  rows.forEach((r) => { maxCols = Math.max(maxCols, r.length); });
  maxCols = Math.max(maxCols, 1);

  // header row (single cell, block name)
  const htr = document.createElement('tr');
  const th = document.createElement('th');
  th.textContent = header;
  htr.appendChild(th);
  table.appendChild(htr);

  rows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cellNodes) => {
      const td = document.createElement('td');
      cellNodes.forEach((n) => td.appendChild(n.cloneNode(true)));
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  // colspan adjust on header
  if (maxCols > 1) th.setAttribute('colspan', String(maxCols));
  // colspan adjust for short rows
  Array.from(table.querySelectorAll('tr')).forEach((tr, i) => {
    if (i === 0) return;
    const tds = Array.from(tr.children);
    if (tds.length < maxCols && tds.length > 0) {
      tds[tds.length - 1].setAttribute('colspan', String(maxCols - tds.length + 1));
    }
  });
  return table;
}

// Convert a block div (delivered nested-div shape) into a DA table.
function convertBlock(blockDiv) {
  const classes = Array.from(blockDiv.classList);
  const header = blockNameFromClasses(classes);
  // direct child divs are rows; each row's direct child divs are cells.
  const rowDivs = Array.from(blockDiv.children).filter((c) => c.tagName === 'DIV');
  const rows = rowDivs.map((rowDiv) => {
    const cellDivs = Array.from(rowDiv.children).filter((c) => c.tagName === 'DIV');
    if (cellDivs.length === 0) {
      // single implicit cell
      return [Array.from(rowDiv.childNodes)];
    }
    return cellDivs.map((cellDiv) => Array.from(cellDiv.childNodes));
  });
  return createTable(rows, header);
}

const main = document.querySelector('main') || document.body;

// --- Cleanup pass (non-authorable junk that leaked from the source scrape) ---
// 1) Tracking beacons / analytics pixels referenced by external hosts.
Array.from(main.querySelectorAll('img, picture source')).forEach((el) => {
  const src = el.getAttribute('src') || el.getAttribute('srcset') || '';
  if (/researchnow\.com|smetrics\.|evidon\.com|doubleclick\.net|\/b\/ss\//.test(src)) {
    const pic = el.closest('picture');
    (pic || el).remove();
  }
});
// 2) Leading free-form metadata paragraph (AEM template junk, not page content).
Array.from(main.querySelectorAll('p')).forEach((p) => {
  if (/Free Form Template\s+[a-f0-9-]{36}/.test(p.textContent)) p.remove();
});
// 2b) Share/print utility strip (Scroll Up "Top", Share, Email, Print) — page chrome.
//     Identify by the utility icon alts, then drop the whole <p> each sits in, plus
//     the adjacent text-label <p> (Share/Print) and dummy href="#" links.
Array.from(main.querySelectorAll('img')).forEach((img) => {
  if (/^(Scroll Up|Share icon|Email icon|Print icon)$/.test(img.getAttribute('alt') || '')) {
    const p = img.closest('p');
    if (p) p.remove();
  }
});
Array.from(main.querySelectorAll('p')).forEach((p) => {
  const t = p.textContent.trim();
  const onlyHashLink = p.querySelector('a[href="#"]') && !p.querySelector('img')
    && /^(Share|Email|Print|Top)$/.test(t);
  if (/^(Share|Print)$/.test(t) && !p.querySelector('a, img')) p.remove();
  else if (onlyHashLink) p.remove();
});
// 3) Empty <p> left behind after beacon removal.
Array.from(main.querySelectorAll('p')).forEach((p) => {
  if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
});

const sections = Array.from(main.children).filter((c) => c.tagName === 'DIV');

const outParts = [];
sections.forEach((section, sIdx) => {
  const frag = document.createElement('div');
  Array.from(section.childNodes).forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'DIV' && node.classList.length > 0) {
      // a block (including section-metadata / metadata)
      frag.appendChild(convertBlock(node));
    } else {
      frag.appendChild(node.cloneNode(true));
    }
  });
  outParts.push(frag.innerHTML);
});

// DA source format: full <body> envelope with empty <header>/<footer> and a
// <main> whose direct children are the section <div>s. This envelope is REQUIRED
// — DA's html2md yields empty output if content is not wrapped this way.
const mainInner = outParts.map((s) => `<div>${s}</div>`).join('\n');
const daHtml = `<body>\n  <header></header>\n  <main>${mainInner}</main>\n  <footer></footer>\n</body>`;

const resolvedOut = outFile || input.replace(/\.plain\.html$/, '.da.html');
fs.writeFileSync(resolvedOut, daHtml);
console.log(`Wrote DA source: ${resolvedOut} (${daHtml.length} bytes, ${sections.length} sections)`);

if (uploadTarget) {
  const { execSync } = require('child_process');
  const url = `https://admin.da.live/source/${uploadTarget}.html`;
  const cmd = `curl -s -o /tmp/da_up.txt -w "%{http_code}" -X POST -F "data=@${resolvedOut};type=text/html" "${url}"`;
  const code = execSync(cmd).toString().trim();
  console.log(`Upload ${uploadTarget}.html -> HTTP ${code}`);
}
