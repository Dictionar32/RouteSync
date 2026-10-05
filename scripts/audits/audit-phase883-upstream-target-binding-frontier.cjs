const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const parser = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts');
const syntax = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts');
const binding = read('packages/core/src/compiler/scanner/lexer/routeAst/routeBindingDeclarationAst.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const assertions = [
  ['target_description_is_syntax_relation', /export const routeTargetDescription/.test(syntax) && /routeTargetDescription\(route, method\)/.test(syntax)],
  ['target_ast_is_projection', /export const routeTargetAst/.test(syntax) && /const description = routeTargetDescription/.test(syntax)],
  ['parser_projects_target_relation', /target:\s*targetAt\(/.test(parser) && /routeTargetAst/.test(parser)],
  ['binding_parser_is_single_producer', /export function parseRouteBindingDeclarations/.test(binding) && (binding.match(/parseRouteBindingDeclarations/g) || []).length === 1],
  ['binding_parser_has_no_production_duplicate', !producer.includes('parseRouteBindingDeclarations(') && !scanner.includes('parseRouteBindingDeclarations(')],
  ['producer_consumes_canonical_binding', /bindings:\s*input\.bindings/.test(read('packages/core/src/compiler/scanner/subscanners/routeProducer.ts'))],
  ['producer_target_comes_from_boundary_operation', /route\.binding\.operation\.handler/.test(producer)],
  ['no_second_route_target_parser', !producer.includes('routeTargetDescription(') && !scanner.includes('routeTargetDescription(')],
];
const passed = assertions.every(([, ok]) => ok);
const report = {
  phase: 883,
  title: 'upstream target and binding frontier',
  status: passed ? 'PASS' : 'FAIL',
  classification: {
    routeTargetDescription: 'SOURCE_EVIDENCE',
    routeTargetAst: 'SYNTAX_PROJECTION',
    parseRouteBindingDeclarations: 'SYNTAX_PARSER_AUTHORITY',
    RouteProducerInput: 'CANONICAL_PROJECTION',
  },
  assertions: Object.fromEntries(assertions),
  recommendation: 'Do not introduce a second RouteDeclarationEvidence model. Target already has a token-relation source and AST projection; bindings have one parser producer and no production duplicate. The next upstream frontier should be binding token evidence only if an existing token relation can supply the same facts without duplicating the regex parser.',
};
fs.writeFileSync(path.join(root, 'scripts/audits/phase883-upstream-target-binding-frontier.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = passed ? 0 : 1;
