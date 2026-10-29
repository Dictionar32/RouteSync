const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const facade = read('packages/core/src/compiler/frontend/php/astClassifierEvidence.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const test = read('packages/core/src/compiler/frontend/php/astClassifierEvidencePort.phase1962.test.ts');
const checks = [
  ['one AST classifier port remains', /interface AstClassifierEvidenceInterface/.test(contract) && /readonly classify:/.test(contract)],
  ['expression request maps to expression result in the interface', /AstClassifierExpressionRequest<TToken>\): AstClassifierExpressionResult<TValue>/.test(contract)],
  ['block request maps to block result in the interface', /AstClassifierBlockRequest<TToken>\): AstClassifierBlockResult<TBlock>/.test(contract)],
  ['runtime implementation exposes correlated overloads', /function classify\(request: Extract<AstClassifierEvidenceRequest<TokenDescriptor>, \{ readonly kind: 'expression' \}>\): AstClassifierExpressionResult<PhpAstValue>/.test(facade) && /function classify\(request: Extract<AstClassifierEvidenceRequest<TokenDescriptor>, \{ readonly kind: 'block' \}>\): AstClassifierBlockResult<PhpBlock>/.test(facade)],
  ['facade does not reclassify mismatched result variants', !/AST classifier contract violation/.test(facade)],
  ['facade does not depend on semantic relations/foundation', !/from ['"][^'"]*semantic\/(?:relations|foundation)/.test(facade)],
  ['upstream AST contract does not depend on semantic relations/foundation', !/from ['"][^'"]*semantic\/(?:relations|foundation)/.test(contract)],
  ['invocation judgment remains the existing outcome-indexed ADT', /LaravelControllerInvocationSemanticJudgmentInterface/.test(judgment) && /php_source_invocation_integration_complete/.test(judgment) && /php_source_invocation_integration_blocked/.test(judgment)],
  ['inventory closure remains a separate existing authority', /LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(inventory)],
  ['type-correlated expression and block calls are covered', /AstClassifierExpressionResult<PhpAstValue>/.test(test) && /AstClassifierBlockResult<PhpBlock>/.test(test)],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
