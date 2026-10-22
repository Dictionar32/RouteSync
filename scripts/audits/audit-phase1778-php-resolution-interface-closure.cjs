const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const target = path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const source = fs.readFileSync(target, 'utf8');
const orderedRules = [
  'reject-malformed-name-evidence',
  'require-complete-source-environment',
  'preserve-fully-qualified-name-identity',
  'apply-function-import-alias-before-namespace-prefixing',
  'apply-qualified-import-alias-to-leading-segment-only',
  'resolve-qualified-name-through-import-prefix-or-current-namespace',
  'resolve-unqualified-function-import-before-namespace-fallback',
  'prefer-known-namespaced-declaration',
  'defer-unqualified-namespaced-name-to-php-runtime-fallback',
  'resolve-global-scope-name-identity',
  'compare-function-identities-case-insensitively-preserving-source-evidence',
  'classify-builtin-only-after-canonical-global-function-identity',
  'never-infer-function-target-from-short-name-alone',
];
const ruleOrderStart = source.indexOf('ruleOrder: Object.freeze([');
const ruleOrderEnd = source.indexOf(']),', ruleOrderStart);
const ruleOrderSource = source.slice(ruleOrderStart, ruleOrderEnd);
const positions = orderedRules.map(rule => ruleOrderSource.indexOf(`'${rule}'`));
const checks = [
  ['contract version advances to 2', source.includes('readonly version: 2;') && source.includes('version: 2,')],
  ['contract retains a closed ordered rule tuple', source.includes('readonly ruleOrder: readonly [') && orderedRules.every(rule => source.includes(`'${rule}'`))],
  ['unqualified import precedes namespace declaration and runtime fallback', positions[6] < positions[7] && positions[7] < positions[8]],
  ['fully-qualified identity precedes alias processing', positions[2] < positions[3] && positions[2] < positions[4]],
  ['function identity comparison preserves case-insensitive PHP semantics', source.includes('identityComparison:') && source.includes('case-insensitive-while-source-spelling-remains-preserved-as-evidence')],
  ['builtin classification follows canonical identity', positions[10] < positions[11]],
  ['short name alone cannot establish target', positions[11] < positions[12]],
  ['deferred result retains namespaced runtime candidate', source.includes('readonly namespaceCandidate: PhpQualifiedFunctionName;')],
  ['deferred result retains global fallback candidate', source.includes('readonly globalFallbackCandidate: PhpQualifiedFunctionName;')],
  ['resolution interface has no semantic relations dependency', !source.includes('semantic/relations')],
  ['resolution interface has no semantic foundation dependency', !source.includes('semantic/foundation')],
  ['interface still owns the resolve boundary', source.includes('readonly resolve: (input: PhpFunctionNameResolutionInput) => PhpFunctionNameResolutionJudgment;')],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
