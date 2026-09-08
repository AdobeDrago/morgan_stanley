# Migration Manifest — Morgan Stanley IM, Individual Investor

**Generated:** 2026-08-31
**Project type:** `doc` · **Source:** morganstanley.com/im/en-us
**DA content source:** `adobedrago / morgan-stanley` → https://da.live/#/adobedrago/morgan-stanley/im/en-us

## Summary
- **7 pages** migrated across **3 templates**
- **8 content blocks created**, **1 reused** (`widget`)
- All pages imported and uploaded to Document Authoring

## Templates

| Template | Pages | Blocks | Import script |
|----------|-------|--------|---------------|
| individual-investor | 4 | hero-campaign, widget, cards-capabilities, columns-featured, cards-insights | import-individual-investor.js |
| capabilities | 2 | hero-capability, columns-numbered, cards-platform, cards-insights | import-capabilities.js |
| campaigns | 1 | hero-capability, columns-overview, cards-explore | import-campaigns.js |

## Pages

| Source page | Template | DA path | Blocks used |
|-------------|----------|---------|-------------|
| individual-investor.html | individual-investor | im/en-us/individual-investor | hero-campaign, widget, cards-capabilities, columns-featured, cards-insights |
| capabilities/alternatives.html | individual-investor | …/capabilities/alternatives | columns-featured, cards-insights |
| capabilities/crypto.html | individual-investor | …/capabilities/crypto | cards-insights |
| capabilities/equity.html | individual-investor | …/capabilities/equity | cards-insights |
| capabilities/fixed-income.html | capabilities | …/capabilities/fixed-income | hero-capability, columns-numbered, cards-platform, cards-insights |
| capabilities/solutions-and-multi-asset.html | capabilities | …/capabilities/solutions-and-multi-asset | hero-capability, columns-numbered, cards-insights |
| campaigns/liquidity | campaigns | …/campaigns/liquidity | hero-capability, columns-overview, cards-explore |

## Content blocks

| Block | Base | Origin | Used in templates | Purpose |
|-------|------|--------|-------------------|---------|
| hero-campaign | hero | new | individual-investor | Full-bleed campaign banner (bg image + heading + subheading + CTA) |
| hero-capability | hero | new | capabilities, campaigns | Light split title banner (title + graphic, no CTA) |
| cards-capabilities | cards | new | individual-investor | Colored capability tiles (icon + title + desc + arrow) |
| cards-insights | cards | new | individual-investor, capabilities | Article cards (thumbnail + tag + title + desc + date) |
| cards-platform | cards | new | capabilities | Solid product-platform tiles (title + arrow) |
| cards-explore | cards | new | campaigns | "Explore More" colored tiles (title + desc + arrow) |
| columns-featured | columns | new | individual-investor | Dark FEATURED promo band (graphic + text + CTA) |
| columns-numbered | columns | new | capabilities | Numbered text columns (numeral + heading + bullets) |
| columns-overview | columns | new | campaigns | Overview text columns (accent + heading + paragraph) |
| widget | widget | **reused** | individual-investor | Loads dynamic widget assets (product search, live NAV quotes) — reference only |

## Infrastructure
- **Page templates:** `tools/importer/page-templates.json`
- **Parsers (10):** one per block above
- **Transformers (3):** `morganstanley-cleanup.js` (site chrome), `morganstanley-sections.js` (section breaks/metadata), `campaigns-fund-tables.js` (strips dynamic fund tables)
- **Import scripts (3):** one per template
- **Reports:** `tools/importer/reports/import-*.report.xlsx`

## Key decisions
- Live product-search / NAV fund-quote components kept as `widget` references (no stale market-data snapshot).
- `campaigns/liquidity` fund tables imported as **headings only**; dynamic table DOM stripped so no volatile product data is captured.
- Blocks reused across templates where structurally similar (`hero-capability`, `cards-insights`, `widget`) to avoid duplicates.
- DA content source corrected from `morgan_stanley` (underscore) to `morgan-stanley` (hyphen) to match the real project repo.

## Outstanding
- Design/styling not yet applied — pages import as default styling.
- Earlier copies of the 4 individual-investor pages may still exist in the old `adobedrago/morgan_stanley` (underscore) DA repo.
