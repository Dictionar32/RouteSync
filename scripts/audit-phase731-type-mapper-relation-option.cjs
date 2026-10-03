const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/semantic/kernel/typeMapper.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = {
  usesCanonicalOptionFold: source.includes('relationOptionFold'),
  exactEliminatesThroughFold: source.includes('relationOptionFold(\n    hit,'),
  sqlOptionEliminatesThroughFold: source.includes('return relationOptionFold(\n    exactType,'),
  castOptionEliminatesThroughFold: source.includes('return relationOptionFold(cast,'),
  noRelationOptionValueAccess: !source.includes('.value'),
  noRelationOptionPredicateAccess: !source.includes('relationIsSome'),
  auditScriptRegistered: pkg.scripts['audit:phase731-type-mapper-relation-option'] === 'node scripts/audit-phase731-type-mapper-relation-option.cjs',
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 731, checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
