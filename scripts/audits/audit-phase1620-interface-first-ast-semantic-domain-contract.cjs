const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticInterface.ts'), 'utf8');
const request = file.slice(file.indexOf('export type AstSemanticClosureRequest ='), file.indexOf('/**\n * A closure is final'));
const closure = file.slice(file.indexOf('export type AstSemanticClosure ='), file.indexOf('export type AstSemanticJudgment ='));
const checks = [
  ['request identity is a domain value object', request.includes('AstSemanticRequestIdentity') && !/requestIdentity:\s*string/.test(request)],
  ['round limit is a numeric domain value object', request.includes('AstSemanticRoundLimit') && !/roundLimit:\s*number/.test(request)],
  ['identity categories have separate discriminants', ['ast_semantic_request_identity', 'ast_semantic_seed_snapshot_identity', 'ast_semantic_rule_set_identity', 'ast_semantic_fact_set_identity', 'ast_semantic_derivation_ledger_identity'].every(kind => file.includes(kind))],
  ['round limit and completed count are distinct domain values', file.includes('AstSemanticRoundLimit') && file.includes('AstSemanticRoundCount') && file.includes("kind: 'ast_semantic_round_limit'") && file.includes("kind: 'ast_semantic_round_count'")],
  ['closure certificate binds the same typed identity categories', ['AstSemanticRequestIdentity', 'AstSemanticSeedSnapshotIdentity', 'AstSemanticRuleSetIdentity', 'AstSemanticFactSetIdentity', 'AstSemanticDerivationLedgerIdentity'].every(kind => closure.includes(kind))],
  ['invalid bound remains an explicit incomplete outcome', closure.includes("'invalid_round_limit' | 'round_limit_reached'") && file.includes("reason: 'invalid_round_limit'")],
  ['closure evaluator validates the underlying numeric domain value', file.includes('Number.isSafeInteger(roundLimit)') && file.includes('roundLimit < 1')],
  ['scanner and runtime implementation are not moved by this contract phase', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts')) && fs.existsSync(path.join(root, 'packages/core/src/semantic'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
