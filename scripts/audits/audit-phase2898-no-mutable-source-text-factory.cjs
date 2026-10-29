const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['source-text factory input uses existing StringValue contract', /readonly create:\s*\(value: StringValue\) => PhpSourceText/.test(frontend)],
  ['PhpSourceText exposes domain bindTo operation', /interface PhpSourceText extends PhpSourceTextContent\s*\{[^}]*readonly bindTo:\s*\(sourceFile: SourceFile\) => PhpSourceDocument/s.test(frontend)],
  ['factory runtime export is interface-first', /export const phpSourceTextFactory:\s*PhpSourceTextFactoryInterface\s*=\s*Object\.freeze/.test(frontend)],
  ['factory uses immutable payload and no mutable self-reference', /const sourceContent:\s*PhpSourceTextContent\s*=\s*Object\.freeze/.test(frontend) && /content:\s*sourceContent/.test(frontend) && !/let sourceText!/.test(frontend) && !/sourceText\s*=\s*Object\.freeze/.test(frontend)],
  ['CLI runtime invokes domain binding operation', /phpSourceTextFactory\.create\(stringValue\(content\)\)\.bindTo\(input\.sourceFile\)/.test(composition)],
  ['upstream barrel exports the frontend contract', barrel.includes("export * from './phpSourceFrontendInterface'")],
  ['no exported function declarations in traced frontend and CLI composition modules', !/^\s*export\s+function\s/m.test(frontend) && !/^\s*export\s+function\s/m.test(composition)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
