const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const projectionContract = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const loweringContract = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts');
const pipelineContract = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionInterface.ts');
const solver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const pipelineImplementation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const subscanner = read('packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts');

const checks = [
  ['scan passes the preflight request-resolution ledger into projection', /projectRouteSyncManifestForRouteManifest\(completeManifest, requestResolutionPreflight\)/.test(scan)],
  ['sync passes the preflight request-resolution ledger into projection', /projectRouteSyncManifestForRouteManifest\(completeManifest, requestResolutionPreflight\)/.test(sync)],
  ['projection input binds manifest and ledger in one typed contract', /interface RouteManifestProjectionInput[\s\S]*manifest: RouteSyncManifest[\s\S]*sourceEvidence: readonly RequestTypeEvidenceReference\[\][\s\S]*requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt\[\][\s\S]*resourceResolutionLedger/.test(projectionContract)],
  ['projection passes the same input into type lowering', /routeManifestTypeLowering\.project\(input\)/.test(projection)],
  ['lowering consumes the supplied ledger rather than recomputing request resolution', /const \{ manifest, sourceEvidence, requestResolutionLedger, resourceResolutionLedger \} = input/.test(lowering) && !/requestTypeDerivationSourceEvidenceInventory\.inventory/.test(lowering)],
  ['lowering passes canonical source evidence and the supplied ledger into the semantic projection operation', /derive\(\{ \.\.\.sourceInput, sourceEvidence, interner, requestResolutionLedger, resourceResolutionLedger \}\)/.test(lowering)],
  ['projection input contract requires the upstream ledger', /readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt\[\]/.test(pipelineContract)],
  ['projection pipeline passes ledger into solver context', /createDerivationContext\(routes, resources, requests, interner, requestResolutionLedger, resourceResolutionLedger\)/.test(pipelineImplementation)],
  ['solver is exposed as export const typed by the existing projection interface', /export const requestTypeDerivationSolver: RequestTypeDerivationProjectionInterface = Object\.freeze/.test(solver)],
  ['solver helper operations are private rather than exported free functions', /function createDerivationContext\(/.test(solver) && /function aggregateRequestTypeGroups\(/.test(solver) && !/export function (createDerivationContext|aggregateRequestTypeGroups)/.test(solver)],
  ['solver no longer independently invokes request resolution', !/requestTypeDerivationRequestResolution\.resolve/.test(solver)],
  ['solver binds a route through its canonical source occurrence key', /canonicalRouteOccurrenceKey\(route\.provenance\)/.test(solver) && /receipt\.route\.occurrenceKey === occurrenceKey/.test(solver)],
  ['solver rejects missing, duplicate, or mismatched route receipts instead of dropping them', /assertRequestResolutionLedgerClosure/.test(solver) && /matches\.length !== 1/.test(solver) && /receipt\.bindingKind !== route\.binding\.request\.kind/.test(solver)],
  ['solver fails closed for unresolved or ambiguous receipts', /cannot consume unresolved upstream request-resolution receipt/.test(solver)],
  ['compatibility subscanner produces the same upstream ledger contract', /requestTypeDerivationRequestResolutionInventory\.resolve\(\{ \.\.\.input, inventory \}\)/.test(subscanner) && /requestTypeDerivationResourceResolutionInventory\.resolve\(\{ \.\.\.input, inventory \}\)/.test(subscanner) && /requestResolutionLedger, resourceResolutionLedger/.test(subscanner)],
  ['lowering contract uses the same projection input type', /UpstreamWiringInterface<RouteManifestProjectionInput, RouteManifestTypeLowering>/.test(loweringContract)],
  ['projection and lowering declare their upstream-to-downstream wiring contract', /direction: 'upstream_to_downstream'/.test(projection) && /upstreamAuthority: 'upstream'/.test(projection) && /direction: 'upstream_to_downstream'/.test(lowering) && /upstreamAuthority: 'upstream'/.test(lowering)],
];

for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
