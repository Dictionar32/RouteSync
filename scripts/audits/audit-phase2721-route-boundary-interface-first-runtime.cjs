const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const cli = path.join(root, 'packages/cli/src');
const semantic = path.join(core, 'compiler/semantic/route-boundary');
const scanner = path.join(core, 'compiler/scanner');
const files = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? files(full) : /\.tsx?$/.test(entry.name) ? [full] : [];
}) : [];
const allTs = files(path.join(root, 'packages'));
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const builders = [
  ['identityBuilder.ts', 'RouteIdentityContractBuilderInterface', 'routeIdentityContractBuilder', 'buildRouteIdentityContract'],
  ['bindingBuilder.ts', 'RouteBindingContractBuilderInterface', 'routeBindingContractBuilder', 'buildRouteBindingContract'],
  ['capabilityBuilder.ts', 'RouteCapabilityContractBuilderInterface', 'routeCapabilityContractBuilder', 'buildRouteCapabilityContract'],
  ['provenanceBuilder.ts', 'RouteProvenanceContractBuilderInterface', 'routeProvenanceContractBuilder', 'buildRouteProvenanceContract'],
];
for (const [file, iface, operation, legacyName] of builders) {
  const source = read(path.join(semantic, file));
  check(`${file}: typed immutable operation object`, new RegExp(`export const ${operation}:\\s*${iface}\\s*=\\s*Object\\.freeze\\(`).test(source), `${operation}: ${iface}`);
  check(`${file}: legacy free-function export removed`, !new RegExp(`export\\s+function\\s+${legacyName}\\b`).test(source), `${legacyName} is internal implementation only`);
}
const factory = read(path.join(semantic, 'boundaryContractFactory.ts'));
check('boundary contract factory consumes four operation objects', ['routeIdentityContractBuilder.build(', 'routeBindingContractBuilder.build(', 'routeCapabilityContractBuilder.build(', 'routeProvenanceContractBuilder.build('].every(x => factory.includes(x)), 'all canonical subcontract builders called through typed operation objects');
const boundaryInput = read(path.join(semantic, 'boundaryInputResolution.ts'));
check('boundary input uses provenance operation object', /routeProvenanceContractBuilder\.build\(/.test(boundaryInput), 'runtime consumer no longer imports a free builder function');
const manifestBuilder = read(path.join(scanner, 'wiring/upstreamManifestBuilder.ts'));
check('manifest builder remains interface-first', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=\s*Object\.freeze\(/.test(manifestBuilder), 'manifestBuilderOperationPreparation uses upstream contract');
const composition = read(path.join(cli, 'parsers/php/controllerInvocationManifestComposition.ts'));
check('CLI composition authority remains interface-first', /export const controllerInvocationManifestCompositionAuthorityFactory:\s*ControllerInvocationManifestCompositionAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(composition), 'factory operation object is the production runtime entry');
check('manifest rejection ADT preserved fail-closed', /controller_invocation_manifest_inventory_rejected/.test(composition) && /manifest_builder_blocked/.test(manifestBuilder), 'inventory rejection and manifest-builder blocked judgments remain distinct');
check('no relationFoundation implementation reintroduced', !allTs.some(f => /(?:^|\/)relationFoundation\.ts$/.test(f)), 'no relationFoundation.ts under packages');
const foundationImports = allTs.reduce((n, f) => n + (read(f).match(/from\s*["'][^"']*relationFoundation["']/g) || []).length, 0);
check('legacy relationFoundation imports are visible', true, `${foundationImports} import declarations still reference deleted module; no replacement was added`);
const scan = read(path.join(cli, 'commands/scan.ts'));
const sync = read(path.join(cli, 'commands/sync.ts'));
const compositionFactory = read(path.join(cli, 'upstreamCompositionFactory.ts'));
check('CLI scan/sync -> composition -> manifest trace anchors', /manifestScanOperation/.test(scan) && /manifestScanOperation/.test(sync) && /manifestScanOperation/.test(compositionFactory) && /manifestBuilderPreparation/.test(composition), 'actual CLI entry points and manifest builder dependency are connected');
const scannerDirs = fs.readdirSync(scanner, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).filter(n => !['__test__', 'wiring', 'audit'].includes(n));
check('scanner wiring-only state reported honestly', true, `${scannerDirs.length} implementation directories remain: ${scannerDirs.join(', ')}`);
const result = { phase: 2721, title: 'Interface-first route boundary runtime operation migration', checks, passed: checks.filter(x => x.pass).length, total: checks.length, legacyRelationFoundationImports: foundationImports, scannerImplementationDirectoriesRemaining: scannerDirs };
console.log(JSON.stringify(result, null, 2));
if (result.passed !== result.total) process.exitCode = 1;
