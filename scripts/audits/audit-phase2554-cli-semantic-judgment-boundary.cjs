const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const solver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const authorityLowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const productionComposition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const checks = [
  ['scan CLI reaches authority projection with an explicit semantic pipeline dependency', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*const requestTypeDerivationPipeline = pipelineResolution\.pipeline[\s\S]*projectRouteSyncManifestForRouteManifest\([\s\S]*requestResolutionPreflight,[\s\S]*requestTypeDerivationPipeline/.test(cliScan)],
  ['sync CLI reaches authority projection with an explicit semantic pipeline dependency', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*const requestTypeDerivationPipeline = pipelineResolution\.pipeline[\s\S]*projectRouteSyncManifestForRouteManifest\([\s\S]*requestResolutionPreflight,[\s\S]*requestTypeDerivationPipeline/.test(cliSync)],
  ['active projection delegates to authority-backed lowering', /createAuthorityBackedRouteManifestProjection\(pipeline\)/.test(projection) && !/routeManifestTypeLowering\.project\(input\)/.test(projection)],
  ['active lowering uses the explicitly interface-typed projection pipeline', /requestTypeDerivationProjectionPipeline\.derive\(/.test(lowering)],
  ['current solver remains an array projection rather than a closed judgment producer', /derive:\s*\(input: RequestTypeDerivationProjectionInput\): readonly RequestType\[\]/.test(solver)],
  ['current solver still has a semantic relations dependency', /semantic\/relations\/relationalSequence/.test(solver)],
  ['upstream closed judgment retains all four outcome variants', /kind: 'derived'[\s\S]*kind: 'incomplete'[\s\S]*kind: 'conflict'[\s\S]*kind: 'invalid_input'/.test(contract)],
  ['upstream contract defines the 32-law semantic contract', /REQUEST_TYPE_DERIVATION_LAW_IDS/.test(contract) && (contract.match(/^  '/gm) || []).length >= 32],
  ['authority-backed lowering preserves every non-projectable outcome in its exhaustive switch', /case 'incomplete'/.test(authorityLowering) && /case 'conflict'/.test(authorityLowering) && /case 'verification_failed'/.test(authorityLowering) && /case 'rejection_verification_failed'/.test(authorityLowering) && /case 'authority_inconsistent'/.test(authorityLowering) && /case 'assessment_integrity_failed'/.test(authorityLowering)],
  ['legacy array output is not wrapped into a fabricated verified judgment', !/kind:\s*'derived'[\s\S]{0,300}requestTypeDerivationSolver/.test(solver)],
  ['missing production composition fails closed instead of falling back', productionComposition.includes('throw new Error(') && productionComposition.includes('Legacy RequestType[] fallback is disabled')],
];
let failed = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failed += 1;
}
const syntaxCheckedSources = [
  ['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts', solver],
  ['packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts', projection],
  ['packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts', authorityLowering],
  ['packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts', read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts')],
  ['packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts', read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts')],
  ['packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts', read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts')],
  ['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts', productionComposition],
  ['packages/cli/src/commands/scan.ts', cliScan],
  ['packages/cli/src/commands/sync.ts', cliSync],
];
let syntaxErrors = 0;
for (const [file, source] of syntaxCheckedSources) {
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  syntaxErrors += errors.length;
  console.log(`${errors.length === 0 ? 'PASS' : 'FAIL'} TypeScript syntax transpilation: ${file}`);
}
if (syntaxErrors > 0) failed += syntaxErrors;
console.log(`Phase 2554 audit: ${checks.length + syntaxCheckedSources.length - failed}/${checks.length + syntaxCheckedSources.length} passed`);
process.exitCode = failed === 0 ? 0 : 1;
