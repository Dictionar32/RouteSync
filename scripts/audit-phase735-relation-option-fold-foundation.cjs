const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const foundation = fs.readFileSync(path.join(root, 'packages/core/src/semantic/kernel/relationFoundation.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = {
  relationOptionFoldUsesRefinementWitness: foundation.includes('relationRefineSingleton(option, relationIsSome)'),
  relationOptionFoldNoUnionValueAccess: !foundation.includes('someBranch(option.value)'),
  refinementWitnessHasTypedOverload: foundation.includes('predicate: (candidate: T) => candidate is U'),
  refinementWitnessImplementationUsesRelationResolve: foundation.includes('return relationResolve(predicate(value), () => [value], () => []);'),
  auditRegistered: pkg.scripts['audit:phase735-relation-option-fold-foundation'] === 'node scripts/audit-phase735-relation-option-fold-foundation.cjs',
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 735, checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
