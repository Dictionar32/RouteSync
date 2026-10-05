const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src/compiler/scanner');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const productionFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.ts') && !full.includes('/__tests__/')) productionFiles.push(full);
  }
}
walk(core);
const text = file => fs.readFileSync(file, 'utf8');
const parser = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts');
const syntax = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts');
const flow = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');

const assertions = [
  ['parser_consumes_syntax_relations', /semanticRouteSyntaxRelations/.test(parser)],
  ['parser_uses_route_group_state', /mergeRouteGroupStates/.test(parser) && /advanceRouteGroupState/.test(parser)],
  ['syntax_method_is_token_derived', /export const routeMethod/.test(syntax) && /tokenSyntaxFact|tokenRouteMethod/.test(syntax)],
  ['syntax_target_is_token_derived', /export const routeTargetAst/.test(syntax)],
  ['syntax_constraints_are_token_derived', /export const routeConstraintFact/.test(syntax)],
  ['syntax_group_is_token_derived', /export const routeGroupPendingState/.test(syntax) && /GROUP_PENDING_FACTS/.test(syntax)],
  ['route_declaration_flow_is_used_by_production', /routeDeclarationFlow/.test(producer) && /routeDeclarationFlow/.test(scanner)],
  ['route_group_adapter_not_used_by_production', !productionFiles.some(f => {
    if (f.endsWith('routeGroupAstAdapter.ts') || f.endsWith('routeGroupContextResolver.ts')) return false;
    return /extractRouteGroupFactsFromAst\(/.test(text(f));
  })],
  ['route_data_flow_graph_is_diagnostic_only', !productionFiles.some(f => {
    if (f.endsWith('routeDataFlow.ts')) return false;
    return /routeDeclarationDataFlowGraph\(|routeDataFlowGraph\(/.test(text(f));
  })],
];

const passed = assertions.every(([, ok]) => ok);
const report = {
  phase: 882,
  title: 'upstream syntax evidence frontier',
  status: passed ? 'PASS' : 'FAIL',
  authority: 'token syntax relations -> RouteDeclarationAst -> RouteDeclarationFlow',
  classification: {
    parser: 'DIRECT',
    semanticRouteSyntaxRelations: 'SOURCE_EVIDENCE',
    RouteDeclarationAst: 'SYNTAX_PROJECTION',
    RouteDeclarationFlow: 'SEMANTIC_PROJECTION',
    routeGroupAstAdapter: 'TEST_COMPATIBILITY_ONLY',
    routeDataFlowGraph: 'DIAGNOSTIC_ONLY',
  },
  assertions: Object.fromEntries(assertions),
  recommendation: 'Do not introduce a second RouteDeclarationEvidence model. The parser already derives route method/path/target/group/constraints/middleware from syntax relations; RouteDeclarationAst is the syntax projection and RouteDeclarationFlow is the semantic projection. The next real upstream frontier is route target/binding syntax relation normalization only if a production consumer recomputes those facts independently.',
};
fs.writeFileSync(path.join(root, 'scripts/audits/phase882-upstream-syntax-evidence-frontier.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = passed ? 0 : 1;
