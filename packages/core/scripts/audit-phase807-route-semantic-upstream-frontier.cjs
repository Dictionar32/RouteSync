const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = {
  upstreamConstraintArgument: source.includes("import type { RouteConstraintArgument } from '../../../../types/upstream/routeConstraints';"),
  semanticStringValueIsUpstream: source.includes("stringValue as semanticStringValue"),
  tokenStringValueSeparated: source.includes('const tokenStringValue ='),
  constraintFoldHasFourBranches: source.includes("values => Object.freeze({ kind: 'values', values: projectRelation(values.values, value => semanticStringValue(value.value)) }))"),
  constraintFoldNoDeadBranch: !source.includes("none => Object.freeze({ kind: 'none' })"),
  groupBindingScopeIsKey: source.includes("() => present('bindingScope')"),
  groupBindingScopeFactExists: source.includes("['bindingScope', cursor =>"),
  targetUsesAstIdentifier: source.includes('readonly controller: AstIdentifier') && source.includes('targetIdentifier(controller.value)'),
  targetAstConsumesIdentifier: source.includes("controller: value.controller, action: value.action") && source.includes("controller: value.controller"),
  noStringValueImportCollision: !source.includes("createRouteParameterName, stringValue }"),
  noParsedDescriptor: !source.includes('ParsedRoute') && !source.includes('ParsedConstraintDescriptor'),
};
console.log(JSON.stringify({ checks, allPass: Object.values(checks).every(Boolean) }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
