const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const inventoryPath = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts';
const inventory = read(inventoryPath);
const guard = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const loweringAuthorityPath = 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts';
const loweringProjectionPath = 'packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts';
const loweringAuthority = read(loweringAuthorityPath);
const loweringProjection = read(loweringProjectionPath);
const checks = [];
const assert = (label, condition) => checks.push({ label, passed: Boolean(condition) });
assert('canonical identity and occurrence keys share the existing upstream interface',
  /export const canonicalRouteIdentity: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRouteIdentity'\]/.test(inventory) &&
  /export const canonicalResourceIdentity: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalResourceIdentity'\]/.test(inventory) &&
  /export const canonicalRequestIdentity: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRequestIdentity'\]/.test(inventory));
assert('source occurrence serialization encodes file before coordinate delimiters',
  /encodeURIComponent\(file\)/.test(inventory) && /sourceSpanIdentity\(span\.file\.value\.value, span\.start\.value, span\.end\.value\)/.test(inventory));
assert('all three evidence domains retain canonical semantic identity and occurrence identity',
  ['routeReference', 'resourceReference', 'requestReference'].every(name => inventory.includes(`const ${name}:`)) &&
  /occurrenceKey,/.test(inventory) && /semanticKey: identity\.semanticKey/.test(inventory));
assert('source-occurrence guard recomputes identities and validates input membership',
  guard.includes('canonicalRouteIdentity') && guard.includes('canonicalResourceIdentity') && guard.includes('canonicalRequestIdentity') &&
  guard.includes('source_occurrence_not_in_input'));
assert('manifest preflight delegates canonical inventory and resolution ledgers to semantic owner',
  /requestTypeDerivationSemanticInputPreparation\.prepare\(input\)/.test(preflight) &&
  /requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(preparation) &&
  /requestTypeDerivationRequestResolutionInventory\.resolve\(\{ \.\.\.input, inventory \}\)/.test(preparation) &&
  /requestTypeDerivationResourceResolutionInventory\.resolve\(\{ \.\.\.input, inventory \}\)/.test(preparation));
assert('scan and sync require the already-assembled upstream pipeline before source identity acquisition',
  /requestTypeDerivationPipeline = composition\?\.requestTypeDerivationPipeline[\s\S]*requestTypeDerivationPipeline === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(scan) &&
  /requestTypeDerivationPipeline = composition\?\.requestTypeDerivationPipeline[\s\S]*requestTypeDerivationPipeline === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(sync));
assert('manifest projection uses current authority and lowering modules, not retired solver paths',
  fs.existsSync(path.join(root, loweringAuthorityPath)) &&
  fs.existsSync(path.join(root, loweringProjectionPath)) &&
  /createAuthorityBackedRouteManifestTypeLowering/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts')) &&
  /createRequestTypeDerivationOperationPreparation/.test(loweringAuthority) &&
  !fs.existsSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts')));
assert('active lowering modules preserve typed blocked outcomes without legacy solver imports',
  /derivation_not_projectable/.test(loweringAuthority) &&
  /kind: 'not_projectable'/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts')) &&
  !/requestTypeDerivationSolver|requestTypeDerivationProjectionPipeline/.test(loweringAuthority + loweringProjection));
for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`);
console.log(`Phase 2552 current-path audit: ${checks.filter(check => check.passed).length}/${checks.length} passed`);
process.exitCode = checks.some(check => !check.passed) ? 1 : 0;
