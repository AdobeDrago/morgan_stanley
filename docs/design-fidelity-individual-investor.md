# Individual Investor — Block Migration + Design Fidelity

**Branch:** migration-manifest · **Preview:** https://migration-manifest--morgan-stanley--adobedrago.aem.page/im/en-us/individual-investor
**Design source:** https://www.morganstanley.com/im/en-us/individual-investor.html

## Root cause of the original flat page
1. **Block code was never committed** — only base `cards/columns/hero/widget` were on the branch; the custom variants existed locally but undeployed, so EDS couldn't decorate them.
2. **DA stored the *delivered* (flat) HTML** — the earlier upload used the nested-div `.plain.html` shape (and later a `<body><main>`-less shape); DA's html→md needs the `<body><header></header><main>…</main><footer></footer>` envelope with blocks expressed as `<table>`s. Wrong shapes yielded empty/flat output.
3. **Images 404'd** — `/media-da/*` assets were never uploaded to DA, and (once uploaded) had to be **previewed** (ingested) and referenced by an **absolute** URL so DA's converter could fetch them at authoring time (relative + Akamai-blocked prod URLs both produced `about:error`).

## What was done
- Built `tools/importer/plain-to-da.js`: converts block-formatted `.plain.html` → DA source tables in the required envelope; rewrites `/media-da/*` to absolute preview URLs (`--media-base`); strips tracking beacons, the free-form-template metadata paragraph, and the Share/Print utility strip.
- Uploaded all 10 `/media-da` assets to DA and previewed them (ingested).
- Re-authored + uploaded DA content for all 4 individual-investor-template pages; previewed.
- Committed block folders: `hero-campaign`, `cards-capabilities`, `columns-featured`, `cards-insights`, `widget-placeholder` (+ reusable variants).
- Styled the 4 blocks from **measured production computed values**; verified at 1280px and 1900px.
- Replaced the two dynamic `widget` references (which 404'd as `/widgets/*.html`) with a static, on-brand `widget-placeholder` (product-search bar + fund-card frame). No stale market data captured.
- Added MS brand palette CSS vars to `styles/styles.css`.

## Acceptance criteria status
| Criterion | Status |
|-----------|--------|
| Renders from blocks (data-block-name) not flat | ✅ hero-campaign, widget-placeholder, cards-capabilities, columns-featured, cards-insights |
| 0 broken images in `<main>` | ✅ 0/15 (after lazy-load) |
| No "Page Not Found" widget error | ✅ widget-placeholder replaces it |
| Reused across the 4 template pages | ✅ same 5 blocks serve landing + alternatives/crypto/equity |
| Layout/color/type parity @1280 & @1900 | ✅ ~90–97% per block (see below) |
| Type in ms-sans | ⚠️ **GAP** — ms-sans is proprietary and not obtainable here; ships **roboto** per agreed decision. To fix: add ms-sans @font-face + files to `fonts/` + `styles/fonts.css` and point `--body-font-family`/`--heading-font-family` at it. |

## Measured parity (production → implemented)
- **hero-campaign**: base rgb(0,90,164) ✓, H1 40/700/white ✓, CTA transparent + 1px white border + radius 0 ✓. ~90%.
- **cards-capabilities**: 6 colored tiles (navy/gray/slate/blue/pale-blue/purple), green square arrow bottom-right ✓. ~97%.
- **columns-featured**: navy band, 40/60 split, pixel graphic left, white square-outline Explore ✓. ~95%.
- **cards-insights**: 3 cards, image + uppercase tag + title + desc + date + green doc icon ✓. ~95%.

## Known gaps / out of scope
- **Font parity (ms-sans)** — documented above; roboto shipped.
- **Header/footer 404s** — the site nav (`/nav`) and footer (`/footer`) documents don't exist yet; that's separate site-chrome migration (navigation/footer orchestrators), not this page-body task.
- A few intentional color deltas where brand vars were used over exact production values (e.g. navy `#002b49` vs measured `#002b51`; Digital Assets tile uses brand purple; teal icons use `--ms-teal`).
