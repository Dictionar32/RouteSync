const fs = require('fs');
const p = 'packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts';
const s = fs.readFileSync(p,'utf8');
const checks = {
  importsConstraintFactType: s.includes('type RouteConstraintSyntaxFact'),
  helperConsumesSemanticFact: s.includes('constraintArgumentAst(item: RouteConstraintSyntaxFact)'),
  readReturnsSemanticFact: s.includes('readonly RouteConstraintSyntaxFact[]'),
  noFreeConstraintStringUnion: !s.includes("readonly value: string } | { readonly kind: 'values'; readonly values: readonly string[] }"),
  parserDelegatesConstraintConstruction: s.includes('return routeConstraintArgumentAst(item.argument);')
};
console.log(JSON.stringify({checks, allPass:Object.values(checks).every(Boolean)}, null, 2));
