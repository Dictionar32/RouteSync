const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const kernelPath = 'packages/core/src/types/upstream/semanticRelationalBehaviorKernel.ts';
const closurePath = 'packages/core/src/types/upstream/semanticClosureEngine.ts';
const testPath = 'packages/core/src/compiler/scanner/lexer/routeAst/semanticClosureContract.phase1631.test.ts';
const kernel = fs.readFileSync(path.join(root, kernelPath), 'utf8');
const closure = fs.readFileSync(path.join(root, closurePath), 'utf8');
const test = fs.readFileSync(path.join(root, testPath), 'utf8');
const constraintAuthority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticConstraintAuthority.ts'), 'utf8');
const checks = [
  { name: 'closed-and-incomplete-are-discriminated-judgments', passed: /status: 'closed'/.test(kernel) && /status: 'incomplete'/.test(kernel) && /phase: 'constraints' \| 'rewrite'/.test(kernel) },
  { name: 'constraint-incompleteness-stops-before-rewrite', passed: /if \(isIncompleteConstraintClosure\(constraintClosure\)\)/.test(kernel) && kernel.indexOf('if (isIncompleteConstraintClosure(constraintClosure))') < kernel.indexOf('resolveRelations(') },
  { name: 'constraint-and-rewrite-provenance-are-preserved', passed: /constraintDerivations\(constraintClosure\.derivations\)/.test(kernel) && /rewriteDerivations\(relationClosure\.derivations\)/.test(kernel) && /source: derivation\.stage/.test(closure) },
  { name: 'final-status-follows-final-stage-status', passed: /if \(relationClosure\.status === 'incomplete'\)/.test(kernel) && /status: 'closed',[\s\S]*?saturated: true/.test(kernel) },
  { name: 'constraint-round-limit-is-enforced-before-recursion', passed: /if \(maxRounds <= 0\)/.test(constraintAuthority) && /const nextRounds = rounds \+ result\.rounds/.test(constraintAuthority) && /nextRounds >= maxRounds/.test(constraintAuthority) },
  { name: 'regression-test-covers-incomplete-and-provenance', passed: /round-limited constraint reasoning/.test(test) && /constraint derivation provenance was discarded/.test(test) && /canonical closure projection erased upstream incompleteness/.test(test) && /exceeded its configured round limit/.test(test) },
];
const report = { phase: 1631, title: 'Closed semantic judgment and staged proof preservation', checks, passed: checks.filter(check => check.passed).length, total: checks.length };
fs.writeFileSync(path.join(root, 'PHASE1631_CLOSED_SEMANTIC_JUDGMENT_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'PHASE1631_CLOSED_SEMANTIC_JUDGMENT_AUDIT.md'), [
  '# Phase 1631 — Closed Semantic Judgment and Staged Proof Preservation', '',
  'The canonical behavior kernel now preserves the distinction between a closed judgment and a round-limited judgment. An incomplete constraint stage terminates the pipeline before rewrite execution. Constraint and rewrite derivations retain their stage provenance in the semantic closure result.', '',
  '## Checks', '',
  ...checks.map(check => `- ${check.passed ? 'PASS' : 'FAIL'} — **${check.name}**`), '',
  `Result: **${report.passed}/${report.total} checks passed**.`, '',
  'Static audit only. Run the Phase 1631 regression test and the project typecheck/build before claiming full verification.', ''
].join('\n'));
console.log(`${report.passed}/${report.total} checks passed`);
for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
if (report.passed !== report.total) process.exitCode = 1;
