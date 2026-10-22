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
  'readonly roundLimit: AstSemanticRoundLimit;',
  'readonly rounds: AstSemanticRoundCount;',
  'readonly verifyClosure:',
  'const verifyClosure =',
  "reason: 'certificate_binding_mismatch'",
  "reason: 'invalid_closed_round_bound'",
  "reason: 'seed_fact_missing_from_closure'",
  "reason: 'derivation_replay_mismatch'",
];
const missing = required.filter((part) => !file.includes(part));
if (missing.length) {
  process.stderr.write(`Phase 1620 audit failed; missing contract elements: ${missing.join(', ')}\n`);
  process.exit(1);
}
if (!fixture.includes('astSemanticInterface.verifyClosure(request, forged)') || !fixture.includes("status: 'rejected'") || !fixture.includes("status).toBe('verified')")) {
  process.stderr.write('Phase 1620 audit failed; fixture does not cover accepted and rejected closure verification.\n');
  process.exit(1);
}
process.stdout.write('Phase 1620 AST semantic domain and closure-verification contract audit passed.\n');
