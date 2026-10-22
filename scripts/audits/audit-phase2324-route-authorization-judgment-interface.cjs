const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/routeAuthorizationSemanticJudgmentInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const authority = read('packages/core/src/compiler/scanner/semantic/route/routeMiddlewareKnowledgeCatalog.ts');
const legacyRouteScanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const contextTracker = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeContextTracker.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const checks = [
  ['upstream authorization judgment is a closed ADT with explicit evidence-presence variants', /export type LaravelRouteAuthorizationSemanticJudgment =[\s\S]*?laravel_route_authorization_middleware_present[\s\S]*?laravel_route_authorization_middleware_absent/.test(contract)],
  ['upstream contract declares a closed judgment authority', /interface LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface[\s\S]*?readonly closed: true[\s\S]*?readonly judge:/.test(contract)],
  ['Laravel route scanner contract exposes authorization authority', /authorizationAuthority: LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface/.test(scannerContract) && /readonly contractVersion: 8/.test(scannerContract)],
  ['scanner consumes authority judgment rather than importing old authorization classifier', /authorizationAuthority\.judge\(middlewares\)/.test(scanner) && !/routeAuthorizationKnowledge/.test(scanner)],
  ['scanner executor invokes the authority exposed by its interface contract', /authorizationAuthority,/.test(scanner) && /laravelRouteScanner\.authorizationAuthority/.test(scanner)],
  ['authority returns only upstream judgment variants and retains middleware evidence', /implements/.test(authority) === false && /LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface/.test(authority) && /laravel_route_authorization_middleware_absent/.test(authority) && /laravel_route_authorization_middleware_present/.test(authority)],
  ['legacy route scanner consumes the canonical judgment vocabulary', /routeAuthorizationSemanticJudgmentAuthority\.judge\(middlewares\)/.test(legacyRouteScanner) && /laravel_route_authorization_middleware_present/.test(legacyRouteScanner)],
  ['route context tracker consumes the canonical judgment vocabulary', /routeAuthorizationSemanticJudgmentAuthority\.judge\(names\)/.test(contextTracker) && /laravel_route_authorization_middleware_present/.test(contextTracker)],
  ['upstream and public barrels export the contract without foundation or relations imports', /routeAuthorizationSemanticJudgmentInterface/.test(upstreamIndex) && /LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface/.test(publicIndex) && !/semantic\/(?:foundation|relations)/.test(contract)],
  ['new upstream contract contains no casts or open-ended escape types', !/\bas\s+(?:any|unknown)\b|\b(?:any|unknown|Record|Map)<|\bnull\b|\bundefined\b/.test(contract)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
process.exitCode = failed.length ? 1 : 0;
