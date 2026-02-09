const { minify } = require('terser');
const fs = require('fs');

async function build() {
  const source = fs.readFileSync('keepTrack.js', 'utf8');

  // Minified UMD build
  const minified = await minify(source, {
    compress: { passes: 2 },
    mangle: true,
    output: { comments: false }
  });
  fs.writeFileSync('keepTrack.min.js', minified.code);
  console.log(`keepTrack.min.js: ${minified.code.length} bytes`);

  // ESM build
  const esmSource = fs.readFileSync('keepTrack.js', 'utf8');
  // Extract the factory function body and re-export as ESM
  const esm = `// KeepTrack ESM build - auto-generated from keepTrack.js
${esmSource
  // Remove UMD wrapper: extract the factory content
  .replace(/^\(function \(root, factory\) \{[\s\S]*?\}\)\(typeof global[\s\S]*?, function \(window\) \{/, 'function factory(window) {')
  .replace(/\}\);\s*$/, '}')
}

const KeepTrack = factory(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : {});
export default KeepTrack;
export { KeepTrack };
`;
  fs.writeFileSync('keepTrack.esm.js', esm);
  console.log(`keepTrack.esm.js: ${esm.length} bytes`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
