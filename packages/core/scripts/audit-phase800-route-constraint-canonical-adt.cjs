const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const syntax = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts'), 'utf8');
const parser = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts'), 'utf8');
const ast = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts'), 'utf8');
const checks = {
  canonicalConstraintArgumentAlias: syntax.includes('export type RouteConstraintSyntaxArgument = RouteConstraintArgumentAst;'),
  noDuplicateConstraintUnion: !syntax.includes("readonly kind: 'pattern';\n    readonly value: RouteConstraintValueAst;"),
  canonicalArgumentPassthrough: syntax.includes('export const routeConstraintArgumentAst = (argument: RouteConstraintSyntaxArgument): RouteConstraintArgumentAst => argument;'),
  parserUsesCanonicalConstraintArgument: parser.includes('argument: constraintArgumentAst(item),'),
  canonicalAstOwnsConstraintArgument: ast.includes('export type RouteConstraintArgumentAst ='),
  noRouteConstraintUnknownCast: !syntax.includes('as unknown') && !parser.includes('as unknown'),
};
console.log(JSON.stringify({checks, allPass:Object.values(checks).every(Boolean)}, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
