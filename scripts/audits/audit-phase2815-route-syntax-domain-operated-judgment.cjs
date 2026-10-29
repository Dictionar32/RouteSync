const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const relationPath = 'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts';
const interfacePath = 'packages/core/src/compiler/frontend/php/routeAst/routeSyntaxSemanticInterface.ts';
const relation = fs.readFileSync(path.join(root, relationPath), 'utf8');
const consumer = fs.readFileSync(path.join(root, interfacePath), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['route syntax judgment factory has an explicit interface', /interface RouteSyntaxSemanticJudgmentFactoryInterface\s*\{[\s\S]*?readonly create:\s*\(cursor: TokenCursor, method: LaravelRouteMethod\) => RouteSyntaxSemanticJudgment/.test(relation)],
  ['judgment factory uses interface-first frozen export', /export const routeSyntaxSemanticJudgmentFactory:\s*RouteSyntaxSemanticJudgmentFactoryInterface\s*=\s*Object\.freeze\(/.test(relation)],
  ['legacy standalone judgment export is absent', !/export const routeSyntaxSemanticJudgment\s*=/.test(relation) && !/export function routeSyntaxSemanticJudgment\s*\(/.test(relation)],
  ['route syntax fact ADT exposes domain-specific proof continuation', /continueForProofRelation:\s*<Output>\(continuation: RouteSyntaxSemanticFactProofContinuation<Output>\) => Output/.test(relation)],
  ['all four fact variants implement their own continuation', ['continuation.routePath(value)', 'continuation.routeConstraint(value)', 'continuation.routeTarget(value)', 'continuation.routeInvocation(value)'].every(fragment => relation.includes(fragment))],
  ['proof relation projection consumes the ADT operation', /fact\.continueForProofRelation\(\{[\s\S]*?routePath:[\s\S]*?routeConstraint:[\s\S]*?routeTarget:[\s\S]*?routeInvocation:/.test(consumer)],
  ['fallback relation inference by tuple lookup is removed', !consumer.includes('ROUTE_SYNTAX_PROOF_RELATIONS') && !/relationFirst\(ROUTE_SYNTAX_PROOF_RELATIONS/.test(consumer)],
  ['runtime caller uses the typed judgment factory', /routeSyntaxSemanticJudgmentFactory\.create\(cursor, method\)/.test(consumer)],
  ['upstream collections module remains exactly empty', collections.length === 0],
  ['no generic reasoning primitive was introduced', !/GenericReasoningPrimitive|UniversalReasoningVisitor|ReasoningDispatcher/.test(relation + consumer)],
];
let failures = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failures += 1;
}
console.log(`${checks.length - failures}/${checks.length} checks passed`);
if (failures) process.exitCode = 1;
