const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const projectionPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowRouteProjection.ts');
const factoryPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowInputFactory.ts');
const cliPath = path.join(root, 'packages/cli/src/commands/sync.ts');
const cliManifestPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const projection = fs.readFileSync(projectionPath, 'utf8');
const factory = fs.readFileSync(factoryPath, 'utf8');
const cli = fs.readFileSync(cliPath, 'utf8');
const cliManifest = fs.readFileSync(cliManifestPath, 'utf8');
const checks = [
  ['route projection result is an explicit ADT', /interface SemanticDataflowRouteProjectionResult\s*\{[\s\S]*?kind: 'semantic_dataflow_route_projection_result'/.test(projection)],
  ['result exposes Laravel domain operation, not generic continuation', /appendToControllerSeed: \(seed: SemanticDataflowInput\) => SemanticDataflowInput/.test(projection) && !/SemanticDataflowRouteProjectionHandlers|continueWith: <Result>/.test(projection)],
  ['domain operation preserves seed data and appends canonical facts', /\.\.\.seed,\s*facts: Object\.freeze\(\[\.\.\.seed\.facts, \.\.\.canonicalFacts\]\)/.test(projection)],
  ['controller seed invokes the ADT operation', /\.project\(sourceModel, controller\)\s*\.appendToControllerSeed\(controller\.semantic\.dataflow\)/.test(factory)],
  ['controller, query and request projection facts remain composed after route facts', /\.\.\.routeEnrichedSeed\.facts,[\s\S]*\.\.\.projections\.controller\.project\(controller\),[\s\S]*\.\.\.projections\.controllerQuery\.project\(controller\),[\s\S]*\.\.\.projections\.request\.project\(sourceModel, controller\)/.test(factory)],
  ['sync runtime reaches canonical manifest operation', /manifestScanOperation\.scan\(/.test(cli) && /routeSyncManifestFlowProjection\.project\(completeManifest\)/.test(cli)],
  ['CLI manifest terminal is domain-operational', /continueForDriftAudit/.test(cliManifest) && /ControllerInvocationManifestTerminalOperationInterface/.test(cliManifest)],
  ['deleted relation foundations remain absent', ['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections.ts remains one newline byte', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 1 && fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).equals(Buffer.from('\n'))],
];
const report = { phase: 3017, title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations — route projection domain operation and CLI manifest trace', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length };
fs.writeFileSync(path.join(root, 'PHASE3017_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'PHASE3017_AUDIT.log'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.passed !== report.total) process.exitCode = 1;
