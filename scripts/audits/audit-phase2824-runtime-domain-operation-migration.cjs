const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const syntaxPath = path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const parserPath = path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts');
const resourcePath = path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/routeResourceDeclarationAst.ts');
const syntax = fs.readFileSync(syntaxPath, 'utf8');
const parser = fs.readFileSync(parserPath, 'utf8');
const resource = fs.readFileSync(resourcePath, 'utf8');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['resource middleware syntax has a domain interface', /interface ResourceMiddlewareSyntaxOperationInterface\s*\{[\s\S]*?readonly derive:/.test(syntax)],
  ['resource middleware syntax runtime export is interface-first', /export const resourceMiddlewareSyntaxOperation:\s*ResourceMiddlewareSyntaxOperationInterface\s*=\s*Object\.freeze\(\{/.test(syntax)],
  ['route target method resolution has a domain interface', /interface RouteTargetMethodSetOperationInterface\s*\{[\s\S]*?readonly resolve:/.test(syntax)],
  ['route target method runtime export is interface-first', /export const routeTargetMethodSetOperation:\s*RouteTargetMethodSetOperationInterface\s*=\s*Object\.freeze\(\{/.test(syntax)],
  ['resource middleware scope has a domain interface', /interface ResourceMiddlewareScopeOperationInterface\s*\{[\s\S]*?readonly resolve:/.test(syntax)],
  ['resource middleware scope runtime export is interface-first', /export const resourceMiddlewareScopeOperation:\s*ResourceMiddlewareScopeOperationInterface\s*=\s*Object\.freeze\(\{/.test(syntax)],
  ['parser consumes target resolution operation', /routeTargetMethodSetOperation\.resolve\(/.test(parser)],
  ['parser consumes middleware syntax operation', /resourceMiddlewareSyntaxOperation\.derive\(/.test(parser)],
  ['resource AST consumes middleware scope operation', /resourceMiddlewareScopeOperation\.resolve\(/.test(resource)],
  ['legacy function-shaped exports are removed', !/export const (resourceMiddlewareSyntax|routeTargetMethodSet|resourceMiddlewareScope)\s*=/.test(syntax)],
  ['upstream collections remains empty', fs.statSync(collections).size === 0],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Phase 2824 runtime domain operation audit: ${checks.length - failed}/${checks.length} checks passed.`);
if (failed) process.exitCode = 1;
