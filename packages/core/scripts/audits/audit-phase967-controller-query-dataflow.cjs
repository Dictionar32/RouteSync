const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const read = p => fs.readFileSync(path.join(repo, p), 'utf8');
const exists = p => fs.existsSync(path.join(repo, p));
const controller = read('packages/core/src/types/upstream/controller.ts');
const projection = read('packages/core/src/types/upstream/semanticDataflowControllerQueryProjection.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const actionScanner = read('packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts');
const analysis = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const manifestSurface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const manifestScanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const fixtureRoot = path.join(repo, 'examples/ecommerce-shop-source/app/Http/Controllers');
const files = fs.readdirSync(fixtureRoot, { recursive: true }).filter(file => String(file).endsWith('.php'));
const content = files.map(file => fs.readFileSync(path.join(fixtureRoot, file), 'utf8')).join('\n');
const checks = {
  upstreamQueryEvidenceContract: controller.includes('ControllerQueryEvidence') && controller.includes('readonly queries: Sequence<ControllerQueryEvidence>'),
  queryEvidenceCarriesInputs: controller.includes('ControllerQueryInput') && controller.includes('readonly inputs: Sequence<ControllerQueryInput>'),
  scannerProducesQueryEvidence: scanner.includes('export function controllerQueryEvidence') && scanner.includes('inputs: sequence(queryOperationsInputs(query.operations))'),
  actionCarriesQueryEvidence: scanner.includes('queries: sequence(controllerQueryEvidence(method, file, queries))'),
  scannerPassesQueriesToAction: actionScanner.includes('controllerActionFromMethod(method, controllerName, fullPath, response, dependencies ?? [], contract.policy, inheritedControllerNames, queries)'),
  projectionExists: exists('packages/core/src/types/upstream/semanticDataflowControllerQueryProjection.ts'),
  projectionExported: index.includes('semanticDataflowControllerQueryProjection'),
  productionConsumesProjection: manifest.includes('extends ManifestDataflowSeedSurface') && manifestSurface.includes('semanticDataflowControllerQueryFacts') && analysis.includes('manifest.dataflowInputs'),
  projectionIsSeedOnly: projection.includes('SemanticDataflowInputFact') && !projection.includes('createSemanticDataflowJudgment') && !projection.includes('relationFixedPoint'),
  projectionUsesCanonicalFacts: projection.includes('controller.semantic.dataflow.facts'),
  authorityStillOwnsClosure: authority.includes('createSemanticDataflowJudgment') && authority.includes('relationFixedPoint'),
  ecommerceHasQueryInputs: /::where\s*\(|::whereKey\s*\(|::findOrFail\s*\(|::find\s*\(/.test(content),
  ecommerceHasRequestQueryValues: /\$request->[^;,)]+/.test(content),
  ecommerceHasRouteScalarQueryValues: /function\s+\w+\s*\([^)]*\bint\s+\$\w+/.test(content),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 967, checks, fixtureControllerPhpFiles: files.length, clean: failed.length === 0, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
