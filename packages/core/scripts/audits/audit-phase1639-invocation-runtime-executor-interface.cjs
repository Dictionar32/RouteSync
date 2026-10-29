const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const executor = read('src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const authority = read('src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const scanner = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['single-invocation judgment is the canonical result contract', /analyze: \(input: InvocationSemanticInput\) => InvocationSemanticJudgment/.test(contract)],
  ['runtime executor is an explicit upstream-authority boundary', /interface InvocationSemanticRuntimeExecutorInterface[\s\S]*authority: 'upstream'[\s\S]*execute: \(input: InvocationSemanticInput\) => InvocationSemanticJudgment/.test(contract)],
  ['runtime executor only delegates to authority', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor) && !/if\s*\(|switch\s*\(|\.filter\(|\.map\(/.test(executor)],
  ['production executor is bound to canonical upstream authority', /createInvocationSemanticRuntimeExecutor\(invocationSemanticAuthority\)/.test(executor)],
  ['authority delegates semantic work to upstream algebra', /analyzeInvocationJudgmentAlgebra\(input\.knowledge, input\.invocation\)/.test(authority)],
  ['scanner facade exposes executor without embedding semantic rules', /invocationSemanticRuntimeExecutor/.test(scanner) && !/INVOCATION_.*_RULE\s*=|semanticRewriteRuntimeExecutor|executeRelations/.test(scanner)],
  ['scanner retains a compatibility facade rather than owning inference', /analyzeInvocationSemantics/.test(scanner) && /analyzeAllInvocationSemantics/.test(scanner)],
];
let failed = false;
for (const [label, pass] of checks) { process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`); if (!pass) failed = true; }
if (failed) process.exitCode = 1;
