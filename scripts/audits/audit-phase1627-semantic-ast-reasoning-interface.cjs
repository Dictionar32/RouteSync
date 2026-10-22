const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const astPath = path.join(root, 'packages/core/src/types/upstream/astSemanticInterface.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/ast-semantic-closure-proof.phase1382.test.ts');
const pipelinePath = path.join(root, 'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts');
const ast = fs.readFileSync(astPath, 'utf8');
const pipeline = fs.readFileSync(pipelinePath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['canonical AST interface declares reasoning strategy', /export type AstSemanticInterface = \{[\s\S]*?readonly reasoning: SemanticReasoningContract<'declarative_relation_rewrite_fixed_point'>/.test(ast)],
  ['canonical AST interface exposes closeVerified', /readonly closeVerified: \(request: AstSemanticClosureRequest\) => AstSemanticClosureAssessment/.test(ast)],
  ['verified closure requires both closed status and verified proof', /if \(closure\.status === 'closed' && verification\.status === 'verified'\)/.test(ast)],
  ['cross-stage authority pipeline exposes canonical AST semantic authority operations', /semanticAuthority: astSemanticInterface/.test(pipeline) && /readonly semanticAuthority: AstSemanticInterface/.test(pipeline)],
  ['incomplete closure remains rejected', /status: 'rejected',[\s\S]*?closure,[\s\S]*?verification,[\s\S]*?reasoning: astSemanticReasoning/.test(ast)],
  ['tests cover accepted and rejected outcomes', test.includes("expected verified semantic closure") && test.includes("expected rejected semantic closure")],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
