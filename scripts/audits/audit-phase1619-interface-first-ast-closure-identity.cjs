const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticInterface.ts'), 'utf8');
const fixture = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__tests__/ast-semantic-closure-proof.phase1382.test.ts'), 'utf8');
const required = [
  'readonly requestIdentity: AstSemanticRequestIdentity;',
  'readonly seedSnapshotIdentity: AstSemanticSeedSnapshotIdentity;',
  'readonly ruleSetIdentity: AstSemanticRuleSetIdentity;',
  'readonly factSetIdentity: AstSemanticFactSetIdentity;',
  'readonly derivationLedgerIdentity: AstSemanticDerivationLedgerIdentity;',
  'const closureIdentity =',
  '...closureIdentity(fixed.value.facts, fixed.value.derivations)',
  'readonly verifyClosure:',
  'const verifyClosure =',
  "reason: 'certificate_binding_mismatch'",
];
const missing = required.filter(value => !file.includes(value));
if (missing.length) {
  process.stderr.write(`Phase 1619 contract audit failed; missing: ${missing.join(', ')}\n`);
  process.exit(1);
}
if (!fixture.includes('closure.certificate.derivationLedgerIdentity') || !fixture.includes('astSemanticInterface.verifyClosure(request, forged)') || !fixture.includes('fact-set identity')) {
  process.stderr.write('Phase 1619 contract audit failed; fixture does not assert certificate/result correlation and closure verification.\n');
  process.exit(1);
}
process.stdout.write('Phase 1619 interface-first AST closure identity contract audit passed.\n');
