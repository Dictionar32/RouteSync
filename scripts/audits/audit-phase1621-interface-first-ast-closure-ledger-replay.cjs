const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticInterface.ts'), 'utf8');
const fixture = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__tests__/ast-semantic-closure-proof.phase1382.test.ts'), 'utf8');
const required = [
  'export type AstSemanticClosureDerivation = AstSemanticDerivation & Readonly<{',
  'readonly round: AstSemanticRoundCount;',
  'const replayedDerivationKeys = new Set<string>();',
  "reason: 'derivation_replay_mismatch'",
  "reason: 'duplicate_rule_identity'",
  'const expectedWitness = `${rule.name.value.value}@round:${round}`;',
  'canonicalSetIdentity(replayFacts.items, semanticFactKey) !== canonicalSetIdentity(closure.facts.items, semanticFactKey)',
];
const missing = required.filter((part) => !file.includes(part));
if (missing.length) {
  process.stderr.write(`Phase 1621 audit failed; missing closure replay contract elements: ${missing.join(', ')}\n`);
  process.exit(1);
}
if (!fixture.includes('incomplete-ledger') || !fixture.includes("reason: 'derivation_replay_mismatch'")) {
  process.stderr.write('Phase 1621 audit failed; regression fixture does not cover an omitted derivation.\n');
  process.exit(1);
}
process.stdout.write('Phase 1621 AST closure ledger replay audit passed.\n');
