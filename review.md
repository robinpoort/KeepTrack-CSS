# JavaScript Library Audit

You are a **senior JavaScript engineer performing a professional code audit**.

Your task is to analyze this repository and determine whether the library is **production-ready for use on public websites**.

Assume the library may run on **high-traffic environments**.
Be critical regarding **security, stability, performance and maintainability**.

Prioritize:

- entry points
- public API
- core modules
- critical architecture

---

# Audit Process

Follow the steps below and produce a structured report.

---

# 1. Library Overview

Describe briefly:

- What the library does
- Its main responsibilities
- The architecture used (functional, class-based, modular, etc.)
- Key entry points
- Whether the design appears intentional and maintainable

---

# 2. Security Review

Look for security risks including:

- XSS vulnerabilities
- unsafe `innerHTML`
- unsafe DOM manipulation
- `eval` or `new Function`
- prototype pollution
- injection risks
- unsafe event delegation
- unsafe parsing of external data

Explain each issue clearly.

Provide safer alternatives when possible.

---

# 3. Bug & Edge Case Detection

Look for:

- logical errors
- race conditions
- missing null checks
- async issues
- incorrect assumptions
- incorrect event handling
- potential runtime crashes

Explain why something might break and how to fix it.

---

# 4. Modern JavaScript Standards

Evaluate whether the code follows modern JS practices:

- `const` / `let`
- optional chaining
- nullish coalescing
- modern async patterns
- avoidance of global scope pollution
- avoidance of legacy patterns

**Note:** this library intentionally uses a UMD wrapper (not ESM) to support plain `<script src>` usage without a bundler. An ESM build (`dist/keepTrack.esm.js`) is generated separately for bundlers. Evaluate the factory function internals for modern JS — do not flag the UMD wrapper itself as a legacy issue.

Suggest improvements where useful.

---

# 5. Performance Review

Look for potential performance problems:

- unnecessary DOM queries
- layout thrashing
- repeated calculations
- inefficient loops
- memory leaks
- event listeners not cleaned up

Suggest optimizations.

---

# 6. Accessibility Review

If the library manipulates the DOM:

Check for:

- keyboard accessibility
- focus management
- ARIA compatibility
- screen reader compatibility

---

# 7. API Design

Evaluate the public API:

- clarity
- predictability
- consistency
- developer ergonomics
- flexibility

Suggest improvements if necessary.

---

# 8. Bundle & Packaging

Evaluate:

- bundle size concerns
- tree-shaking compatibility
- module side effects
- package structure
- ESM support
- compatibility with modern bundlers

---

# 9. TypeScript Readiness

Evaluate whether the library:

- provides type definitions
- can easily be typed
- exposes stable interfaces

Suggest improvements if TypeScript support would help.

---

# 10. Browser Compatibility

Identify risks such as:

- unsupported APIs
- missing polyfills
- modern features without fallback

Mention if the library appears **modern-browser-only**.

---

# 11. Documentation Consistency

Review documentation files including:

- README.md
- agents.md
- docs/*
- examples
- inline comments

Determine whether:

- documentation matches the actual API
- documented features exist
- undocumented features exist
- instructions are outdated
- examples still work

Highlight **any mismatch between documentation and implementation**.

---

# 12. Code Quality

Evaluate:

- readability
- naming clarity
- modularity
- separation of concerns
- maintainability

Suggest refactoring where appropriate.

---

# 13. Suggested Improvements

Provide a prioritized list:

### Critical
Issues that must be fixed before production.

### Recommended
Important improvements.

### Nice to Have
Minor improvements.

---

# 14. Scoring

Provide a score from **1 to 10** for:

| Category | Score | Explanation |
|--------|--------|--------|
| Security | | |
| Code Quality | | |
| Architecture | | |
| Performance | | |
| Maintainability | | |
| Documentation Accuracy | | |

---

# 15. Final Verdict

Provide a final assessment:

**Production Ready:**
Yes / No / With Changes

Explain briefly.

---

# 16. NPM Publishing Readiness

Check:

- package.json completeness
- exports field
- module / main fields
- files whitelist
- versioning strategy

---

# Important Rules

- Be critical but constructive
- Avoid vague feedback
- Prefer concrete suggestions
- Provide example code where useful
- Highlight the most important issues first
