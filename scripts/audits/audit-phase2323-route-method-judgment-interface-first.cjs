const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts');
const ast = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const publicIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['upstream owns the canonical LaravelRouteMethod vocabulary', /export type LaravelRouteMethod =/.test(contract) && /import type \{ LaravelRouteMethod \} from/.test(ast)],
  ['upstream contract exposes a closed resource-vs-standard method judgment ADT', /export type LaravelRouteDeclarationMethodJudgment =[\s\S]*?laravel_route_declaration_method_resource[\s\S]*?laravel_route_declaration_method_standard/.test(contract)],
  ['authority contract is explicit on LaravelRouteScannerInterface', /declarationMethodAuthority: LaravelRouteDeclarationMethodJudgmentAuthority/.test(contract)],
  ['upstream authority returns only closed ADT arms', /LaravelRouteDeclarationMethodJudgmentAuthority/.test(authority) && /laravel_route_declaration_method_resource/.test(authority) && /laravel_route_declaration_method_standard/.test(authority)],
  ['scanner executor consumes injected judgment instead of routeDeclarationSemanticKind', /methodAuthority\.judge\(declaration\.method\)/.test(scanner) && !/routeDeclarationSemanticKind/.test(scanner)],
  ['resource emitter receives the narrowed resource method without a cast', /methodJudgment\.method/.test(scanner) && !/declaration\.method as ResourceRouteMethod/.test(scanner)],
  ['syntax AST reuses upstream method vocabulary rather than duplicating it', /export type \{ LaravelRouteMethod \}/.test(ast) && !/export type LaravelRouteMethod =/.test(ast)],
  ['resource emitter reuses upstream vocabulary and needs no mode cast', /export type ResourceRouteMethod = LaravelResourceRouteMethod/.test(emitter) && /const mode: RouteResourceMode = resourceMethod/.test(emitter) && !/resourceMethod as RouteResourceMode/.test(emitter)],
  ['public and upstream barrels expose the authority', /laravelRouteDeclarationMethodSemanticAuthority/.test(publicIndex) && /laravelRouteDeclarationMethodSemanticAuthority/.test(upstreamIndex)],
  ['no foundation or relations dependency is added to upstream method contract/authority', !/semantic\/(?:foundation|relations)/.test(contract + authority)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
process.exitCode = failed.length ? 1 : 0;
