# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-04-02

### Added
- `--keeptrack-scroll-padding-top` CSS custom property on `:root` — the value used for `scroll-padding-top` is now also exposed as a custom property so it can be referenced elsewhere in CSS

### Fixed
- `destroy()` crashed with "types is not iterable" when 2+ elements were tracked, because `forEach(cleanupElement)` passed the array index as `configOverride`
- Anchor scroll lock could unlock prematurely mid-flight; double-rAF now also checks proximity to the target scroll position before releasing the lock
- CSS variable name prefixes derived from element IDs are now validated against an allowed character set, preventing malformed custom property names

### Changed
- Named constants replace magic numbers: `STUCK_THRESHOLD_PX`, `MAX_CONVERGENCE_ITERATIONS`, `ANCHOR_SCROLL_TIMEOUT_MS`
- Added JSDoc comments to `resolveTopPxWithMeasurer`, `checkStickyElements`, and `updateScrollPaddingForTarget`
- `ResizeObserver` unavailability now logs a `console.warn` instead of failing silently

## [1.0.4] - 2026-03-06

### Fixed
- `stickyStateCache` was not reset in `destroy()`, causing stale sticky state after re-init
- `stickyStateCache` was not invalidated in `invalidateStickyTopCache()`, causing stale results after resize/DOM mutation
- `checkStickyElements` mutated the config cache object as a side effect; replaced with a dedicated `stickyStateCache` WeakMap

### Changed
- TypeScript types extracted from `build.js` to `src/keepTrack.d.ts` for better IDE support
- `observe()` now logs a warning when the element has no `data-keeptrack` attribute
- `sameTypes()` simplified with `Array.prototype.every`
- README updated to document `KeepTrack()` without `new`

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
