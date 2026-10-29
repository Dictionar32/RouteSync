const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts');
const ast = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationAst.ts');
const syntax = read('packages/core/src/compiler/frontend/php/routeAst/syntaxValue.ts');
const relations = read('packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const checks = [
  ['existing upstream contract defines a distinct target-method vocabulary', /export type LaravelRouteTargetMethod = LaravelStandardRouteMethod/.test(contract)],
  ['method judgment input uses only target HTTP verbs', /interface LaravelRouteDeclarationMethodJudgmentInput[\s\S]*?targetMethods: readonly LaravelRouteTargetMethod\[\]/.test(contract)],
  ['match judgment carries only target HTTP verbs', /kind: 'laravel_route_declaration_method_match'[\s\S]*?targetMethods: readonly LaravelRouteTargetMethod\[\]/.test(contract)],
  ['standard judgment carries one resolved HTTP method without unrelated target-method evidence', /kind: 'laravel_route_declaration_method_standard'[\s\S]*?httpMethods: readonly \[HttpMethod\]/.test(contract) && !/kind: 'laravel_route_declaration_method_standard';[^}]*targetMethods/.test(contract)],
  ['AST evidence no longer permits declaration-family names as target verbs', /readonly targetMethods: readonly LaravelRouteTargetMethod\[\]/.test(ast)],
  ['syntax defines a closed target-method vocabulary', /export type SyntaxRouteTargetMethod = 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' \| 'options' \| 'head' \| 'query'/.test(syntax)],
  ['target-method parser has a dedicated vocabulary catalog', /routeTargetMethodValues: Catalog<SyntaxRouteTargetMethod>/.test(syntax) && /tokenRouteTargetMethod/.test(syntax)],
  ['match argument parser consumes the dedicated target-method parser', /tokenRouteTargetMethod\(token\)/.test(relations)],
  ['resource and any declarations resolve to no synthetic target method', /\['any', routeTargetEmpty\]/.test(relations) && /\['resource', routeTargetEmpty\]/.test(relations)],
  ['standard declarations carry their own closed target-method identity', /routeTargetIdentity\('get'\)/.test(relations) && /routeTargetIdentity\('head'\)/.test(relations)],
  ['upstream method authority contract version advances', /contractVersion: 8/.test(contract) && /contractVersion: 8/.test(authority)],
  ['route scanner and outcomes advance together', (contract.match(/contractVersion: 26/g) || []).length >= 4 && /contractVersion: 26/.test(scanner)],
  ['runtime route scanner does not reconstruct declaration-family names into HTTP target methods', !/targetMethods: readonly LaravelRouteMethod\[\]/.test(ast) && !/targetMethods: readonly LaravelRouteMethod\[\]/.test(contract)],
  ['no new foundation dependency is introduced in the modified semantic path', !/semantic\/foundation/.test(contract + authority + ast + syntax + relations + scanner)],
  ['Laravel QUERY is represented by the evolved method judgment and execution vocabulary', /laravel_route_declaration_method_query/.test(contract) && /QUERY: 'QUERY'/.test(read('packages/core/src/types/upstream/routeExecutionVocabulary.ts'))],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
if (failed.length) process.exitCode = 1;
