const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['source text construction has a named interface contract', frontend.includes('export interface PhpSourceTextFactoryInterface')],
  ['source text runtime export is interface-first', /export const phpSourceTextFactory:\s*PhpSourceTextFactoryInterface\s*=\s*Object\.freeze\(/.test(frontend)],
  ['source text construction is a named operation with domain-typed input', /readonly create:\s*\(value: StringValue\) => PhpSourceText/.test(frontend) && /create:\s*\(value: StringValue\): PhpSourceText/.test(frontend)],
  ['legacy callable export phpSourceTextOf is absent from the upstream module', !/export const phpSourceTextOf\s*=\s*\(/.test(frontend) && !/export function phpSourceTextOf\s*\(/.test(frontend)],
  ['upstream barrel exposes the frontend contract module', barrel.includes("export * from './phpSourceFrontendInterface'")],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
  ['upstream frontend module has no exported function declarations', !/^\s*export\s+function\s/m.test(frontend)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
