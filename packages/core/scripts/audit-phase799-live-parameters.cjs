const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const route = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts'), 'utf8');
const model = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/model/modelColumnFactsCanonical.ts'), 'utf8');
const parser = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/model/modelParser.ts'), 'utf8');

const checks = {
  noDeadRouteStrategyParameters: !/\b_[A-Za-z][A-Za-z0-9]*\b/.test(route),
  routeTargetResolverClosedAdt: /kind: 'identity'/.test(route) && /kind: 'match_arguments'/.test(route),
  routeTargetResolverUsesCursor: /resolveRouteTargetMethodResolver[\s\S]*start\.callArgumentCursor/.test(route),
  constraintStrategyUsesPresence: /ConstraintStrategy = \(parameter: string, second: Presence<TokenCursor>/.test(route) && /presenceFold\(second/.test(route),
  targetCandidatesNoDeadMethodParameter: /targetDescriptionCandidates = \(route: TokenCursor\)/.test(route),
  targetSelectionUsesCandidate: /relationFirstOr\(targetDescriptionCandidates\(route\), candidate =>/.test(route),
  modelColumnBuilderNoDeadSpanParameter: !/_span: SourceSpan/.test(model),
  modelParserPassesCorrelatedFactsOnly: /buildModelColumnFacts\(correlateModelColumnFacts\(columns, casts, span\)\)/.test(parser),
};
const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
