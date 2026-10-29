'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scopes = [
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/upstreamCompositionFactory.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestProjectionOutcome.ts',
  'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts',
  'packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts',
  'packages/core/src/compiler/frontend/php/routeAst/routeSyntaxSemanticInterface.ts',
  'packages/core/src/compiler/frontend/php/routeAst/routeDataFlow.ts',
  'packages/core/src/compiler/frontend/php/routeAst/syntaxValue.ts',
];
const pattern = /^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^\s*export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/gm;
const findings = [];
const routeSemanticInterface = fs.readFileSync(path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/routeSyntaxSemanticInterface.ts'), 'utf8');
for (const relative of scopes) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  for (const match of source.matchAll(pattern)) {
    const name = match[1] || match[2];
    const line = source.slice(0, match.index).split('\n').length;
    findings.push({ file: relative, line, name, category: relative.includes('semanticRouteSyntaxRelations') ? 'route-syntax-owner' : relative.includes('routeManifestProjectionOutcome') ? 'manifest-ADT-owner' : relative.includes('manifestScanOperationInterface') || relative.includes('upstreamCompositionFactory') || relative.includes('controllerInvocationManifestCompositionInterface') ? 'manifest-runtime-boundary' : 'route-runtime-consumer' });
  }
}
const grouped = new Map();
for (const finding of findings) grouped.set(finding.category, (grouped.get(finding.category) || 0) + 1);
console.log('Phase 2822 — Fully typed runtime scanner operation inventory');
const interfaceFirst = /export const routeSyntaxSemanticInterfaceFactory:\s*RouteSyntaxSemanticInterfaceFactoryInterface\s*=\s*Object\.freeze\(/.test(routeSemanticInterface) && !/^export const routeSyntaxSemanticInterface(?:At|Contract)?\s*=\s*\(/m.test(routeSemanticInterface);
console.log(`${interfaceFirst ? 'PASS' : 'FAIL'} route syntax semantic projection uses one explicit interface-first operation object`);
console.log(`Inspected ${scopes.length} manifest/route runtime owner files.`);
for (const [category, count] of grouped) console.log(`${category}: ${count} exported function/arrow candidates`);
console.log(`Total candidates: ${findings.length}`);
console.log('Priority: keep existing manifest boundary interfaces; next migrate route-syntax operations by domain and call-site, then route dataflow and token vocabulary.');
console.log('Do not mechanically wrap constructors, preserve utility semantics, or export internal implementations through upstream barrel without owner-contract review.');
console.log('The inventory is read-only; the route syntax semantic projection was migrated separately to an interface-first operation object.');
if (findings.length === 0 || !interfaceFirst) process.exitCode = 1;
