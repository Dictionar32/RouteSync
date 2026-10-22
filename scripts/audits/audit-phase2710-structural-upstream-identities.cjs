'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const occurrence = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const walkTs = (relative) => {
  const absolute = path.join(root, relative);
  const entries = fs.statSync(absolute).isDirectory() ? fs.readdirSync(absolute, { withFileTypes: true }) : [];
  if (!fs.statSync(absolute).isDirectory()) return relative.endsWith('.ts') ? [relative] : [];
  return entries.flatMap((entry) => walkTs(path.join(relative, entry.name)));
};
const manifestPathFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/upstreamCompositionFactory.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  ...walkTs('packages/core/src/compiler/scanner/wiring'),
  ...walkTs('packages/core/src/compiler/scanner/orchestrator'),
  ...walkTs('packages/core/src/compiler/semantic/request-type-derivation'),
];
const exportedFunctionFiles = manifestPathFiles.filter((file) => /^\s*export\s+function\s+/m.test(read(file)));
const checks = [
  ['upstream contract owns structural canonical route coordinates', /RequestTypeCanonicalRouteIdentity\s*=\s*Readonly<[\s\S]*?coordinates:\s*Pick<RouteSemanticFlow\['identity'\]\['coordinates'\], 'method' \| 'path' \| 'name'>/.test(contract)],
  ['upstream contract owns structural canonical route domain', /domain:\s*Pick<RouteSemanticFlow\['identity'\]\['domain'\], 'resource' \| 'domain' \| 'group'>/.test(contract)],
  ['upstream interface exposes route domain equality', /readonly sameCanonicalRouteIdentity:\s*\([\s\S]*?RequestTypeCanonicalRouteIdentity[\s\S]*?RequestTypeCanonicalRouteIdentity[\s\S]*?\) => boolean/.test(contract)],
  ['upstream interface exposes resource domain equality', /readonly sameCanonicalResourceIdentity:\s*\([\s\S]*?RequestTypeCanonicalResourceIdentity[\s\S]*?RequestTypeCanonicalResourceIdentity[\s\S]*?\) => boolean/.test(contract)],
  ['upstream interface exposes request domain equality', /readonly sameCanonicalRequestIdentity:\s*\([\s\S]*?RequestTypeCanonicalRequestIdentity[\s\S]*?RequestTypeCanonicalRequestIdentity[\s\S]*?\) => boolean/.test(contract)],
  ['route equality compares structural fields instead of semanticKey', /sameCanonicalRouteIdentityImplementation[\s\S]*?left\.coordinates\.method === right\.coordinates\.method[\s\S]*?left\.domain\.group\.value\.value === right\.domain\.group\.value\.value/.test(inventory) && !/sameCanonicalRouteIdentityImplementation[\s\S]{0,800}semanticKey\s*===/.test(inventory)],
  ['request equality compares tagged domain fields instead of semanticKey', /sameCanonicalRequestIdentityImplementation[\s\S]*?left\.identityKind === 'http_request_identity'[\s\S]*?left\.formType\.value\.value === right\.formType\.value\.value/.test(inventory) && !/sameCanonicalRequestIdentityImplementation[\s\S]{0,800}semanticKey\s*===/.test(inventory)],
  ['route collision detection uses structural equality', /routes\.findIndex\(candidate => sameCanonicalRouteIdentityImplementation\([\s\S]*?routes\.filter\(candidate => sameCanonicalRouteIdentityImplementation/.test(inventory)],
  ['request collision detection uses structural equality', /requests\.findIndex\(candidate => sameCanonicalRequestIdentityImplementation\([\s\S]*?requests\.filter\(candidate => sameCanonicalRequestIdentityImplementation/.test(inventory)],
  ['occurrence membership delegates identity to upstream operations', /sameCanonicalRouteIdentity\(identity, expectedIdentity\)/.test(occurrence) && /sameCanonicalResourceIdentity\(identity, expectedIdentity\)/.test(occurrence) && /sameCanonicalRequestIdentity\(identity, expectedIdentity\)/.test(occurrence)],
  ['audited upstream manifest-forming path has no exported function declarations', exportedFunctionFiles.length === 0],
  ['runtime operations are exported as interface-typed object', /export const requestTypeDerivationSourceEvidenceInventory:\s*RequestTypeDerivationSourceEvidenceInventoryInterface\s*=\s*Object\.freeze\(\{[\s\S]*?sameCanonicalRouteIdentity:\s*sameCanonicalRouteIdentityImplementation[\s\S]*?sameCanonicalResourceIdentity:\s*sameCanonicalResourceIdentityImplementation[\s\S]*?sameCanonicalRequestIdentity:\s*sameCanonicalRequestIdentityImplementation/.test(inventory)],
];
let failed = 0;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed++; }
console.log(`\nPhase 2710 structural upstream identity audit: ${checks.length - failed}/${checks.length} assertions passed.`);
process.exitCode = failed ? 1 : 0;
