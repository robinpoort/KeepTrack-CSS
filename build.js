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
    output: { comments: false },
    sourceMap: {
      filename: 'keepTrack.min.js',
      url: 'keepTrack.min.js.map'
    }
  });
  fs.writeFileSync(path.join(DIST, 'keepTrack.min.js'), minified.code);
  fs.writeFileSync(path.join(DIST, 'keepTrack.min.js.map'), minified.map);
  console.log(`dist/keepTrack.min.js: ${minified.code.length} bytes`);
  console.log(`dist/keepTrack.min.js.map: ${minified.map.length} bytes`);

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

  // TypeScript type definition — copied from src/keepTrack.d.ts
  const dts = fs.readFileSync(path.join(__dirname, 'src', 'keepTrack.d.ts'), 'utf8');
  fs.writeFileSync(path.join(DIST, 'keepTrack.d.ts'), dts);
  console.log(`dist/keepTrack.d.ts: ${dts.length} bytes`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
