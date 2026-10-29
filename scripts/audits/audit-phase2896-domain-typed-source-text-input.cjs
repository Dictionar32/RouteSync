const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['source-text factory contract accepts existing StringValue domain value', /readonly create:\s*\(value: StringValue\) => PhpSourceText/.test(frontend)],
  ['runtime implementation accepts StringValue and supplies domain bindTo operation', /create:\s*\(value: StringValue\): PhpSourceText\s*=> \{[\s\S]*?bindTo:\s*\(sourceFile: SourceFile\): PhpSourceDocument\s*=> Object\.freeze\(/.test(frontend)],
  ['factory runtime export remains interface-first', /export const phpSourceTextFactory:\s*PhpSourceTextFactoryInterface\s*=\s*Object\.freeze\(/.test(frontend)],
  ['CLI composition imports source-text factory and uses its domain operation', /import \{[\s\S]*?phpSourceTextFactory,[\s\S]*?\} from '@routesync\/core';/.test(composition) && /phpSourceTextFactory\.create\(stringValue\(content\)\)\.bindTo\(input\.sourceFile\)/.test(composition)],
  ['CLI no longer assembles PhpSourceText inline', !/content:\s*Object\.freeze\(\{\s*kind:\s*'php_source_text'/.test(composition)],
  ['upstream barrel exports the frontend contract module', barrel.includes("export * from './phpSourceFrontendInterface'")],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
  ['upstream frontend module has no exported function declarations', !/^\s*export\s+function\s/m.test(frontend)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
