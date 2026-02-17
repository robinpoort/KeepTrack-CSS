# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2026-02-17

### Added
- Support `data-keeptrack-id` as an alternative prefix source for CSS custom property names
- Added demo coverage for `data-keeptrack-id` in `index.html`

### Changed
- `data-keeptrack-id` now takes precedence over `id` when both are present
- Parent targeting via `data-keeptrack-target-parent` now overrides `:root` placement for prefixed variables (`id` and `data-keeptrack-id`)
- Sticky state variable naming now uses the same prefix resolution (`data-keeptrack-id` -> `id`)
- Mutation handling now reacts to `data-keeptrack-id` changes

### Tests
- Added coverage for `data-keeptrack-id` root-prefix behavior and precedence
- Added coverage for parent-target override behavior with both `id` and `data-keeptrack-id`

## [1.0.2] - 2025-02-01

Prepping for npmjs.com launch. No code changes.

## [1.0.1] - 2025-02-01

Prepping for npmjs.com launch. No code changes.

## [1.0.0] - 2025-01-01

### Added
- UMD, ESM and minified builds with TypeScript definitions
- Track computed CSS properties as CSS custom properties via `data-keeptrack`
- Scrollbar width and height tracking (`--scrollbar-width`, `--scrollbar-height`)
- Target parent or ancestor for variable placement (`data-keeptrack-target-parent`)
- Sticky element detection with `data-keeptrack-stuck` attribute and `--stuck` variable
- Scroll-padding-top management for anchor navigation (`data-keeptrack-scroll-padding`)
- Programmatic `observe()` / `unobserve()` API
- `recalculate()` for manual refresh
- `onChange` callback
- ResizeObserver and MutationObserver integration
- Optional rAF polling for non-layout property changes
- Debounced resize handling
- CI workflow with Node 18/20
