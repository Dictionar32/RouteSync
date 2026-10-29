const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['PhpSourceText input remains existing StringValue domain contract', /readonly create:\s*\(value: StringValue\) => PhpSourceText/.test(frontend)],
  ['PhpSourceText ADT exposes domain operation bindTo', /interface PhpSourceText extends PhpSourceTextContent\s*\{[^}]*readonly bindTo:\s*\(sourceFile: SourceFile\) => PhpSourceDocument/s.test(frontend)],
  ['factory constructs interface-first immutable PhpSourceText with bindTo operation', /export const phpSourceTextFactory:\s*PhpSourceTextFactoryInterface\s*=\s*Object\.freeze\([\s\S]*?create:\s*\(value: StringValue\): PhpSourceText\s*=>\s*\{[\s\S]*?const sourceContent:\s*PhpSourceTextContent\s*=\s*Object\.freeze\([\s\S]*?bindTo:\s*\(sourceFile: SourceFile\): PhpSourceDocument\s*=>\s*Object\.freeze\(/.test(frontend)],
  ['CLI reader delegates document construction to PhpSourceText.bindTo', /phpSourceTextFactory\.create\(stringValue\(content\)\)\.bindTo\(input\.sourceFile\)/.test(composition)],
  ['CLI reader no longer assembles PhpSourceDocument inline', !/return phpSourceDocumentReadResultFactory\.complete\(Object\.freeze\(\{\s*kind:\s*'php_source_document'/.test(composition)],
  ['upstream barrel exports the frontend contract module', barrel.includes("export * from './phpSourceFrontendInterface'")],
  ['no exported function declaration in audited frontend/CLI composition modules', !/^\s*export\s+function\s/m.test(frontend) && !/^\s*export\s+function\s/m.test(composition)],
  ['no let/definite-assignment workaround remains in source-text factory', !/let sourceText!/.test(frontend) && !/sourceText\s*=\s*Object\.freeze/.test(frontend)],
  ['document content captures immutable payload without self-reference', /content:\s*sourceContent/.test(frontend)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
