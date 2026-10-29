const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const relationPath = 'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts';
const parserPath = 'packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts';
const relation = fs.readFileSync(path.join(root, relationPath), 'utf8');
const parser = fs.readFileSync(path.join(root, parserPath), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['route path fact has a domain continuation', /continueForAcceptance:\s*<Output>\(continuation: RoutePathTokenAcceptanceContinuation<Output>\) => Output/.test(relation)],
  ['route-path actual evidence is an explicit closed ADT', /export type RoutePathTokenActual =\s*\| \{ readonly kind: 'string'; readonly value: string \}\s*\| \{ readonly kind: 'other'; readonly tokenType: TokenDescriptor\['type'\] \}\s*\| \{ readonly kind: 'none' \}/.test(relation)],
  ['fact factory is interface-first and frozen', /export const routePathTokenFactFactory:\s*RoutePathTokenFactFactoryInterface\s*=\s*Object\.freeze\(/.test(relation)],
  ['acceptance operation is interface-first and frozen', /export const routePathTokenAcceptanceOperation:\s*RoutePathTokenAcceptanceOperationInterface\s*=\s*Object\.freeze\(/.test(relation)],
  ['legacy exported path fact function removed', !/export const routePathTokenFact\s*=/.test(relation) && !/export function routePathTokenFact\s*\(/.test(relation)],
  ['legacy exported boolean predicate removed', !/export const isRoutePathToken\s*=/.test(relation) && !/export function isRoutePathToken\s*\(/.test(relation)],
  ['path acceptance delegates to fact continuation', /routePathTokenFactFactory\.create\(cursor, method\)\.continueForAcceptance\(/.test(relation)],
  ['path acceptance contains no generic relation fold or membership call', (() => { const start = relation.indexOf('export const routePathTokenAcceptanceOperation:'); const end = relation.indexOf('export interface RouteResourceMiddlewareSyntaxModel', start); const body = relation.slice(start, end); return !/relationOptionFold|relationContains|relationVariantFold|relationResolve/.test(body); })()],
  ['string acceptance matches the domain ADT variant directly', /string: actual => actual\.kind === 'string'/.test(relation)],
  ['expectation lookup is performed once per acceptance', !/routePathTokenFact\(cursor, method\).*routePathTokenFact\(cursor, method\)/s.test(relation)],
  ['runtime parser consumes typed acceptance operation', /routePathTokenAcceptanceOperation\.accepts\(at, method\)/.test(parser)],
  ['runtime parser no longer imports old predicate', !/\bisRoutePathToken\b/.test(parser)],
  ['upstream collections remains exactly empty', collections.length === 0],
  ['no generic reasoning primitive was introduced', !/GenericReasoningPrimitive|UniversalReasoningVisitor|ReasoningDispatcher/.test(relation + parser)],
];
let failures = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failures += 1;
}
console.log(`${checks.length - failures}/${checks.length} checks passed`);
if (failures) process.exitCode = 1;
