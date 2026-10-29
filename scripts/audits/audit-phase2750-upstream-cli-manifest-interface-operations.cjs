#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, pass) => {
  checks.push({ name, pass: Boolean(pass) });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
};
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const projectionAuthority = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const loweringAuthority = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const integrated = read('packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const index = read('packages/core/src/index.ts');
check('manifest projection entrypoint is an interface-typed operation object',
  /export interface RouteManifestProjectionOperationsInterface/.test(projection) &&
  /export const routeManifestProjectionOperations:\s*RouteManifestProjectionOperationsInterface\s*=\s*Object\.freeze\(\{/.test(projection));
check('projection authority factory is an interface-typed operation object',
  /export interface AuthorityBackedRouteManifestProjectionFactoryInterface/.test(projectionAuthority) &&
  /export const authorityBackedRouteManifestProjectionFactory:\s*AuthorityBackedRouteManifestProjectionFactoryInterface\s*=\s*Object\.freeze\(\{/.test(projectionAuthority));
check('type lowering factory is an interface-typed operation object',
  /export interface AuthorityBackedRouteManifestTypeLoweringFactoryInterface/.test(loweringAuthority) &&
  /export const authorityBackedRouteManifestTypeLoweringFactory:\s*AuthorityBackedRouteManifestTypeLoweringFactoryInterface\s*=\s*Object\.freeze\(\{/.test(loweringAuthority));
check('integrated manifest authority factory is an interface-typed operation object',
  /export interface IntegratedRouteManifestAuthorityFactoryInterface/.test(integrated) &&
  /export const integratedRouteManifestAuthorityFactory:\s*IntegratedRouteManifestAuthorityFactoryInterface\s*=\s*Object\.freeze\(\{/.test(integrated));
check('projection composition consumes factory object rather than loose function',
  /authorityBackedRouteManifestProjectionFactory\.create\(pipeline\)/.test(composition));
check('authority consumes lowering factory object rather than loose function',
  /authorityBackedRouteManifestTypeLoweringFactory\.create\(pipeline\)/.test(projectionAuthority));
check('scanner runtime entrypoints are interface-typed operation objects',
  /export const routeSyncManifestScanOperationFactory:\s*RouteSyncManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(\{/.test(scanner) &&
  /export const routeSyncManifestScanner:\s*RouteSyncManifestScannerInterface\s*=\s*Object\.freeze\(\{/.test(scanner));
check('old loose manifest projection/factory exports are absent from public entrypoint',
  !/projectRouteSyncManifestForRouteManifest|createRouteManifestProjection|createAuthorityBackedRouteManifestProjection|createAuthorityBackedRouteManifestTypeLowering|createIntegratedRouteManifestAuthority/.test(index));
check('public entrypoint exports interface-first operation objects',
  /routeManifestProjectionOperations/.test(index) && /authorityBackedRouteManifestProjectionFactory/.test(index) &&
  /authorityBackedRouteManifestTypeLoweringFactory/.test(index) && /integratedRouteManifestAuthorityFactory/.test(index));
const failed = checks.filter((item) => !item.pass);
console.log(`\nPhase 2750 upstream CLI manifest interface-operation audit: ${checks.length - failed.length}/${checks.length} assertions passed.`);
console.log('SCOPE: static source assertions only; does not establish full TypeScript typecheck, unit tests, package build, or CLI end-to-end behavior.');
if (failed.length) process.exitCode = 1;
