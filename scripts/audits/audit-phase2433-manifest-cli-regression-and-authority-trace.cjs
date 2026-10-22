const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const syncPath = path.join(root, 'packages/cli/src/commands/sync.ts');
const loweringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const projectionPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const authorityPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const integratedAuthorityPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts');

const sync = fs.readFileSync(syncPath, 'utf8');
const lowering = fs.readFileSync(loweringPath, 'utf8');
const projection = fs.readFileSync(projectionPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const integratedAuthority = fs.readFileSync(integratedAuthorityPath, 'utf8');

const checks = [
  ['sync evidence output does not reference undeclared outputPath', !sync.includes("path.dirname(outputPath)") && sync.includes("path.resolve(process.cwd(), 'routesync.request-type-source-evidence.json')")],
  ['legacy projection is still the active default lowering', lowering.includes('requestTypeDerivationProjectionPipeline.derive')],
  ['active projection still imports the legacy lowering singleton', projection.includes("from './routeManifestTypeLowering'") && projection.includes('routeManifestTypeLowering.project(manifest)')],
  ['authority-backed projection already exists and accepts the upstream pipeline', authority.includes('createAuthorityBackedRouteManifestProjection') && authority.includes('RequestTypeDerivationSemanticPipelineInterface')],
  ['integrated-manifest authority already exists and accepts the upstream pipeline', integratedAuthority.includes('createIntegratedRouteManifestAuthority') && integratedAuthority.includes('RequestTypeDerivationSemanticPipelineInterface')],
];

for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}

const failed = checks.filter(([, passed]) => !passed);
const unresolved = checks.filter(([label, passed]) => passed && /legacy projection|active projection/.test(label));
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed.\n`);
process.stdout.write(`${unresolved.length} confirmed active-path authority gaps remain; this audit does not claim RequestType authority closure.\n`);
if (failed.length > 0) process.exitCode = 1;
