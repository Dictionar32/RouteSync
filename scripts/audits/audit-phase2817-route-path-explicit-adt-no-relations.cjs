const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourcePath = 'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts';
const parserPath = 'packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts';
const tracePath = 'packages/core/src/types/upstream/PHASE2804_CLI_MANIFEST_INTERFACE_RUNTIME_AUDIT.md';
const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
const parser = fs.readFileSync(path.join(root, parserPath), 'utf8');
const trace = fs.readFileSync(path.join(root, tracePath), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const start = source.indexOf('export const routePathTokenAcceptanceOperation:');
const end = source.indexOf('export interface RouteResourceMiddlewareSyntaxModel', start);
const acceptance = source.slice(start, end);
const checks = [
  ['route-path actual is a closed domain ADT', /export type RoutePathTokenActual =\s*\| \{ readonly kind: 'string'; readonly value: string \}\s*\| \{ readonly kind: 'other'; readonly tokenType: TokenDescriptor\['type'\] \}\s*\| \{ readonly kind: 'none' \}/.test(source)],
  ['actual evidence is built from cursor presence without tokenSyntaxFact relation option', /const actual: RoutePathTokenActual = presenceFold\([\s\S]*?token\.type === 'STRING'/.test(source) && !/const actual: RoutePathTokenActual[^;]*tokenSyntaxFact/.test(source)],
  ['domain fact owns acceptance continuation', /continueForAcceptance: <Output>\(continuation: RoutePathTokenAcceptanceContinuation<Output>\) => Output/.test(source) && /continuation\[expectation\]\(actual\)/.test(source)],
  ['acceptance operation is interface-first and frozen', /export const routePathTokenAcceptanceOperation: RoutePathTokenAcceptanceOperationInterface = Object\.freeze\(/.test(source)],
  ['acceptance uses direct ADT match and no relation utilities', /string: actual => actual\.kind === 'string'/.test(acceptance) && !/relationOptionFold|relationContains|relationVariantFold|relationResolve|relationFirst|relationEqual/.test(acceptance)],
  ['runtime parser uses typed operation', /routePathTokenAcceptanceOperation\.accepts\(at, method\)/.test(parser)],
  ['runtime parser no longer imports legacy predicate', !/\bisRoutePathToken\b/.test(parser)],
  ['CLI manifest trace documentation exists', /manifestScanOperation\.scan/.test(trace) && /LaravelSourceAstPipelineInterface\.execute/.test(trace)],
  ['upstream collections remains exactly 0 bytes', collections.length === 0],
  ['no generic reasoning primitive introduced', !/GenericReasoningPrimitive|UniversalReasoningVisitor|ReasoningDispatcher/.test(source + parser)],
];
let failures = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failures += 1;
}
console.log(`${checks.length - failures}/${checks.length} checks passed`);
if (failures) process.exitCode = 1;
