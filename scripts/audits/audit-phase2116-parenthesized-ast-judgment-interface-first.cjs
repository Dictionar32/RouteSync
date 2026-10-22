const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const testPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astParenthesizedExpressionJudgment.phase2116.test.ts');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const parenthesized = runtime.slice(runtime.indexOf('function classifyParenthesized('), runtime.indexOf('function classifyCast('));
const checks = [
  ['parenthesized resolver returns a closed AST rule judgment', /function classifyParenthesized\(tokens: readonly TokenDescriptor\[\]\): AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure>/.test(parenthesized)],
  ['parenthesized resolver delegates delimiter recognition to upstream token structure', /scannerTokenStructureInterface\.matchLeadingDelimiter/.test(parenthesized)],
  ['parenthesized resolver handles malformed delimiter evidence explicitly', /case 'malformed'[\s\S]*kind: 'malformed_parenthesized_expression'/.test(parenthesized)],
  ['parenthesized resolver preserves the matched delimiter evidence contents', /classifyAstTokens\(evidence\.contents\)/.test(parenthesized)],
  ['parenthesized resolver no longer imports or returns RelationOption', !/RelationOption|relationGate|relationEqual|relationNone|relationSome/.test(parenthesized)],
  ['parenthesized rule uses the judgment branch rather than the legacy adapter', /expressionRule\(EXPRESSION_CANDIDATE\.parenthesized, \{ kind: 'judgment', resolve: input => classifyParenthesized\(input\.tokens\) \}\)/.test(runtime)],
  ['AST classifier interface preserves request/result overload correlation', /readonly classify: \{\s*\(request: AstClassifierExpressionRequest<TToken>\): AstClassifierExpressionResult<TValue>;\s*\(request: AstClassifierBlockRequest<TToken>\): AstClassifierBlockResult<TBlock>;/s.test(contract)],
  ['focused regression test covers matched parenthesized expression projection', /Phase 2116 parenthesized AST judgment/.test(test) && /classifyAstTokens\(tokens\('\(1 \+ 2\)'\)\)/.test(test)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\nPhase 2116 audit: ${checks.length - failed}/${checks.length} checks passed.\n`);
process.exitCode = failed === 0 ? 0 : 1;
