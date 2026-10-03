const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const graph = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/binders/resource/index.ts'), 'utf8');
const checks = {
  typedResolverGraphRules: graph.includes('SemanticRewritePattern<ResolverGraphRelation>') && graph.includes('resolverGraphRule('),
  middlewareIsTypedPropertyName: graph.includes('readonly middleware: readonly PropertyName[];'),
  noLegacyBindResourceExport: !index.includes('    bindResource,') && !index.includes('bindResource,\n'),
  canonicalBindResourceDefinitionExport: index.includes('bindResourceDefinition'),
  noStringResolverGraphRuleRelation: !/when:\s*\[\{\s*relation:\s*'route_input'/.test(graph),
};
const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({ phase: 712, checks, pass: failed.length === 0, failed: failed.map(([name]) => name) }, null, 2));
process.exitCode = failed.length ? 1 : 0;
