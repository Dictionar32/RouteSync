const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['interface-declares-single-judgment-operation', /analyze:\s*\(input:\s*InvocationSemanticInput\)\s*=>\s*InvocationSemanticJudgment/.test(contract)],
  ['algebra-owns-single-judgment-operation', /export const analyzeInvocationJudgmentAlgebra/.test(algebra)],
  ['algebra-owns-missing-invocation-obligation', /invocation_evidence_missing/.test(algebra) && /invocation_not_present_in_semantic_knowledge/.test(algebra)],
  ['authority-delegates-to-algebra', /analyzeInvocationJudgmentAlgebra\(input\.knowledge, input\.invocation\)/.test(authority)],
  ['authority-does-not-construct-obligations-or-proofs', !/SemanticInvocationObligation|InvocationSemanticProof|missingInvocationJudgment/.test(authority)],
  ['aggregate-api-remains-explicitly-separate', /analyzeAllInvocationSemantics/.test(authority)],
  ['scanner-facade-delegates-to-upstream-authority', /analyzeInvocationSemantics/.test(scanner) && /invocationSemanticAuthority/.test(scanner)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
