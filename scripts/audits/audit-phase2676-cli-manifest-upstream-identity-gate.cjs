const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/cli/src/upstreamCompositionFactory.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const checks = [
  ['inventory-to-AST verifier interface exists in upstream contract', /RequestTypeDerivationInventoryAstVerificationInterface/.test(upstream)],
  ['inventory-to-AST verifier implementation is exported', /export const requestTypeDerivationInventoryMatchesAst/.test(verifier)],
  ['verifier checks AST inventory before any judgment branch', /const judgment = inference\.judgment;[\s\S]{0,500}if \(!requestTypeDerivationInventoryMatchesAst\(inference\.preparedInput\)\)/.test(verifier)],
  ['inventory mismatch raises a typed verification gap', /prepared inventory identity does not match raw AST occurrences and provenance/.test(verifier)],
  ['conflict closure retains its independent AST inventory gate', /requestTypeDerivationInventoryMatchesAst\(inference\.preparedInput\)/.test(verifier)],
  ['proof verifier no longer contains escaped newline in import list', !/ClosureVerificationInterface,\\n\s+type RequestTypeDerivationInventoryAstVerificationInterface/.test(verifier)],
  ['CLI composition uses canonical upstream assembly', /assembleRequestTypeDerivationProductionPipeline\(semanticComposition\)/.test(composition)],
  ['CLI composition rejection is represented as a closed result', /routesync_cli_upstream_semantic_assembly_rejected/.test(composition)],
  ['scan consumes injected semantic pipeline', /composition\.requestTypeDerivationPipeline/.test(scan)],
  ['scan consumes injected manifest authority', /composition\.manifestComposition/.test(scan)],
  ['scan computes source-resolution preflight from complete manifest', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan)],
  ['scan passes exact preflight to authority-backed projection', /\.project\([\s\S]{0,180}requestResolutionPreflight/.test(scan)],
  ['sync consumes injected semantic pipeline', /composition\.requestTypeDerivationPipeline/.test(sync)],
  ['sync consumes injected manifest authority', /composition\.manifestComposition/.test(sync)],
  ['sync computes source-resolution preflight from complete manifest', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync)],
  ['sync passes exact preflight to authority-backed projection', /\.project\([\s\S]{0,180}requestResolutionPreflight/.test(sync)],
  ['projection lowers only on verified projected result', /case 'projected':[\s\S]*lowerRouteSyncManifestToRouteManifest/.test(projection)],
  ['projection blocked result remains explicit', /kind: 'manifest_projection_blocked'/.test(projection)],
  ['legacy RequestType fallback is prohibited in scan path', /No legacy RequestType\[\] fallback is permitted/.test(scan)],
  ['audit command is registered', pkg.scripts?.['audit:phase2676-cli-manifest-upstream-identity-gate'] === 'node scripts/audits/audit-phase2676-cli-manifest-upstream-identity-gate.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) failed++;
}
console.log(`Phase 2676 CLI/manifest/upstream identity-gate audit: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
