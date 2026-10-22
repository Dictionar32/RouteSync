'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const packageJson = JSON.parse(read('package.json'));
const routeIdentityStart = inventory.indexOf('export const canonicalRouteIdentity:');
const routeIdentityEnd = inventory.indexOf('export const canonicalResourceIdentity:', routeIdentityStart);
const routeIdentityBody = inventory.slice(routeIdentityStart, routeIdentityEnd);
const checks = [
  ['route semantic identity is owned by the existing upstream canonical identity operation', /export const canonicalRouteIdentity:/.test(routeIdentityBody)],
  ['route identity includes HTTP method', /coordinates\.method/.test(routeIdentityBody)],
  ['route identity includes declared path and route name', /coordinates\.path\.value\.value/.test(routeIdentityBody) && /coordinates\.name\.value\.value/.test(routeIdentityBody)],
  ['route identity includes resource, domain, and group coordinates', /domain\.resource\.value\.value/.test(routeIdentityBody) && /domain\.domain\.value\.value/.test(routeIdentityBody) && /domain\.group\.value\.value/.test(routeIdentityBody)],
  ['each identity component is encoded before delimiter composition', /\]\.map\(encodeURIComponent\)\.join\(':'\)/.test(routeIdentityBody)],
  ['route semantic key no longer collapses to route name alone', !/semanticKey: `route:\$\{identity\.coordinates\.name\.value\.value\}`/.test(routeIdentityBody) && /semanticKey: `route:\$\{endpointIdentity\}`/.test(routeIdentityBody)],
  ['source occurrence identity remains separate from semantic endpoint identity', /canonicalRouteOccurrenceKey/.test(inventory) && /canonicalResourceOccurrenceKey/.test(inventory) && /canonicalRequestOccurrenceKey/.test(inventory) && /occurrenceKey,/.test(inventory)],
  ['occurrence keys are produced by upstream inventory operations rather than reconstructed in the verifier', /canonicalRouteOccurrenceKey\(source\.source\.provenance\)/.test(verifier) && /canonicalResourceOccurrenceKey\(source\.source\.source\)/.test(verifier) && /canonicalRequestOccurrenceKey\(source\.source\.source\)/.test(verifier) && !/const coordinates =/.test(verifier)],
  ['verifier recomputes route identity through the same canonical operation', /canonicalRouteIdentity\(source\.source\.identity\)/.test(verifier) && /canonicalRouteIdentity\(route\.identity\)/.test(verifier)],
  ['active manifest projection uses injected authority-backed pipeline, not legacy RequestType[] solver', /createAuthorityBackedRouteManifestProjection\(pipeline\)/.test(lowering) && !/requestTypeDerivationProjectionPipeline\.derive/.test(lowering)],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase2531-route-endpoint-identity'] === 'node scripts/audits/audit-phase2531-route-endpoint-identity.cjs'],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = Number(failed.length > 0);
