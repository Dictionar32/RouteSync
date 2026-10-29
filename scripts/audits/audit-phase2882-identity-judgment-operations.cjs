const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/sourceProjectIdentity.ts'), 'utf8');
const inventory = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts'), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['identity factory is interface-first', /export interface LaravelSourceProjectIdentityFactoryInterface/.test(source) && /export const createLaravelSourceProjectIdentity:\s*LaravelSourceProjectIdentityFactoryInterface\s*=\s*Object\.freeze/.test(source)],
  ['identity factory exposes named create operation', /readonly create:/.test(source) && /create:\s*\(/.test(source)],
  ['project identity relation has domain continuation handlers', /interface SourceProjectIdentityRelationHandlers<Result>/.test(source) && /readonly continueWith:/.test(source)],
  ['same relation owns continuation', /handlers\.onSame\(relation\)/.test(source)],
  ['different relation owns continuation', /handlers\.onDifferent\(relation\)/.test(source)],
  ['inventory authority consumes relation continuation', /return relation\.continueWith\(/.test(inventory)],
  ['inventory authority no longer switches on relation kind', !/switch\s*\(relation\.kind\)/.test(inventory)],
  ['collections utility remains empty', collections.trim().length === 0],
  ['phase2882 audit script registered', Boolean(packageJson.scripts['audit:phase2882-identity-judgment-operations'])],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, pass]) => !pass).length;
console.log(`Phase2882 identity judgment operations: ${checks.length - failed}/${checks.length} checks passed`);
process.exitCode = failed ? 1 : 0;
