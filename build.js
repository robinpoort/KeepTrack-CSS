const { minify } = require('terser');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src', 'keepTrack.js');
const DIST = path.join(__dirname, 'dist');

async function build() {
  // Ensure dist/ exists
  if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST);
  }

  const source = fs.readFileSync(SRC, 'utf8');

  // Copy UMD source to dist/
  fs.writeFileSync(path.join(DIST, 'keepTrack.js'), source);
  console.log(`dist/keepTrack.js: ${source.length} bytes`);

  // Minified UMD build
  const minified = await minify(source, {
    compress: { passes: 2 },
    mangle: true,
    output: { comments: false }
  });
  fs.writeFileSync(path.join(DIST, 'keepTrack.min.js'), minified.code);
  console.log(`dist/keepTrack.min.js: ${minified.code.length} bytes`);

  // ESM build
  const esm = `// KeepTrack ESM build - auto-generated from src/keepTrack.js
${source
  // Remove UMD wrapper: extract the factory content
  .replace(/^\(function \(root, factory\) \{[\s\S]*?\}\)\(typeof global[\s\S]*?, function \(window\) \{/, 'function factory(window) {')
  .replace(/\}\);\s*$/, '}')
}

const KeepTrack = factory(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : {});
export default KeepTrack;
export { KeepTrack };
`;
  fs.writeFileSync(path.join(DIST, 'keepTrack.esm.js'), esm);
  console.log(`dist/keepTrack.esm.js: ${esm.length} bytes`);

  // TypeScript type definition
  const dts = `interface KeepTrackOptions {
  /** Track scrollbar width as --scrollbar-width on :root (default: true) */
  scrollbarWidth?: boolean;
  /** Track scrollbar height as --scrollbar-height on :root (default: false) */
  scrollbarHeight?: boolean;
  /** Debounce delay in ms for resize and DOM changes (default: 250) */
  debounceTime?: number;
  /** Enable requestAnimationFrame polling for non-layout changes (default: false) */
  poll?: boolean;
  /** Detect when sticky elements become stuck (default: false) */
  detectSticky?: boolean;
  /** Update sticky top values every frame (default: false) */
  stickyTopDynamic?: boolean;
  /** Callback when a tracked value changes */
  onChange?: ((el: HTMLElement, prop: string, value: string) => void) | null;
}

interface KeepTrackInstance {
  /** Re-initialize with new options. Cleans up the previous instance first. */
  init(options?: KeepTrackOptions): void;
  /** Remove all event listeners, observers, CSS variables and attributes. */
  destroy(): void;
  /** Manually trigger a recalculation of all tracked elements and scrollbar dimensions. */
  recalculate(): void;
  /** Programmatically start tracking an element. */
  observe(el: HTMLElement): void;
  /** Stop tracking an element and clean up its CSS variables. */
  unobserve(el: HTMLElement): void;
}

declare function KeepTrack(options?: KeepTrackOptions): KeepTrackInstance;

export default KeepTrack;
export { KeepTrack, KeepTrackOptions, KeepTrackInstance };
`;
  fs.writeFileSync(path.join(DIST, 'keepTrack.d.ts'), dts);
  console.log(`dist/keepTrack.d.ts: ${dts.length} bytes`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
