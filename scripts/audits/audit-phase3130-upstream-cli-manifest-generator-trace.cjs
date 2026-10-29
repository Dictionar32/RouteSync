#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const has = (file, pattern) => pattern.test(read(file));

const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const generate = read('packages/cli/src/commands/generate.ts');
const projection = read('packages/core/src/types/upstream/runtimeManifestOperations.ts');
const composition = read('packages/core/src/types/upstream/runtimeCompositionOperations.ts');
const coreIndex = read('packages/core/src/index.ts');
const coreUpstream = read('packages/core/src/upstream.ts');
const cliIndex = read('packages/cli/src/index.ts');
const codeGeneration = read('packages/cli/src/generators/manifestCodeGenerationOperation.ts');

const sourceRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const sourceFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', 'build', '__generated__', '__tests__', '__test__'].includes(entry.name)) walk(full);
    if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) sourceFiles.push(full);
  }
};
for (const sourceRoot of sourceRoots) {
  const directory = path.join(root, sourceRoot);
  if (fs.existsSync(directory)) walk(directory);
}

const inventory = sourceFiles.reduce((result, file) => {
  const source = fs.readFileSync(file, 'utf8');
  result.exportedFunctionDeclarations += (source.match(/\bexport\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g) || []).length;
  result.exportedArrowConstants += (source.match(/\bexport\s+const\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=\s*(?:async\s*)?(?:\([^;]*?\)|[A-Za-z_$][\w$]*)\s*=>/gs) || []).length;
  return result;
}, { exportedFunctionDeclarations: 0, exportedArrowConstants: 0 });

const checks = {
  phase: 3130,
  title: 'Upstream CLI manifest generator trace and explicit runtime operation frontier',
  sourceToManifest: {
    sourceDiscovery: 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
    manifestBuilderPreparation: 'packages/core/src/types/upstream/runtimeCompositionOperations.ts',
    manifestProjection: 'packages/core/src/types/upstream/runtimeManifestOperations.ts',
    cliConsumers: ['packages/cli/src/commands/scan.ts', 'packages/cli/src/commands/sync.ts'],
    generatorConsumer: 'packages/cli/src/commands/generate.ts',
  },
  upstreamAdtOperations: {
    projectionResultOwnsRequireCompleteManifest: /export type RouteManifestProjectionCompositionResult = ManifestProjectedOutcome \| ManifestProjectionBlockedOutcome/.test(projection) && /requireCompleteManifest/.test(projection),
    blockedProjectionOwnsTypedError: /class RouteManifestProjectionBlockedError/.test(projection) && /throw new RouteManifestProjectionBlockedError/.test(projection),
    preflightDoesNotFabricateResolvedLedger: /route_manifest_request_resolution_preflight_blocked/.test(projection) && /request_resolution_authority_not_composed/.test(projection) && !/kind: 'resolved'/.test(projection),
    preparationIsExplicitlyTyped: /manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(composition),
  },
  cliTrace: {
    scanConsumesActionableManifestOutcome: /routeManifestProjection\.requireCompleteManifest\(\)/.test(scan),
    syncConsumesActionableManifestOutcome: /routeManifestProjection\.requireCompleteManifest\(\)/.test(sync),
    scanDoesNotUseGenericProjectionContinuation: !/routeManifestProjection\.continue\(/.test(scan),
    syncDoesNotUseGenericProjectionContinuation: !/routeManifestProjection\.continue\(/.test(sync),
    activeCommandsDoNotUseCompilerBridge: !/(CompilerBridge|emitFullBundle)/.test(`${scan}\n${sync}\n${generate}`),
  },
  generatorTrace: {
    generatorHasExplicitOperationInterface: /export interface ManifestCodeGenerationOperationInterface/.test(codeGeneration),
    generatorOutcomeOwnsFollowUpOperation: /requireCompleteGeneration/.test(codeGeneration),
    generatorBlocksWithoutContractIRProducer: /RouteManifest -> ContractIR -> IREmitter is not composed/.test(codeGeneration),
  },
  publicRuntimeExports: {
    coreIndexExportsManifestRuntimeTypes: /RouteManifestProjectionCompositionResult/.test(coreIndex),
    coreUpstreamExportsManifestRuntimeTypes: /RouteManifestProjectionCompositionResult/.test(coreUpstream),
    coreIndexExportsCodegenOperationIndirectly: /runtimeCompositionOperations/.test(coreIndex),
    cliIndexExportsCodegenOperation: /manifestCodeGenerationOperation/.test(cliIndex) && /ManifestCodeGenerationOperationInterface/.test(cliIndex),
  },
  migrationFrontier: {
    inventory,
    repositoryWideExportConversion: false,
    primitiveAndControlFlowErasure: false,
    fullTypecheckVerified: false,
    fullTestSuiteVerified: false,
    phpToCliManifestGeneratorE2eVerified: false,
  },
};

const requiredChecks = [
  ['upstreamAdtOperations.projectionResultOwnsRequireCompleteManifest', checks.upstreamAdtOperations.projectionResultOwnsRequireCompleteManifest],
  ['upstreamAdtOperations.blockedProjectionOwnsTypedError', checks.upstreamAdtOperations.blockedProjectionOwnsTypedError],
  ['upstreamAdtOperations.preflightDoesNotFabricateResolvedLedger', checks.upstreamAdtOperations.preflightDoesNotFabricateResolvedLedger],
  ['upstreamAdtOperations.preparationIsExplicitlyTyped', checks.upstreamAdtOperations.preparationIsExplicitlyTyped],
  ['cliTrace.scanConsumesActionableManifestOutcome', checks.cliTrace.scanConsumesActionableManifestOutcome],
  ['cliTrace.syncConsumesActionableManifestOutcome', checks.cliTrace.syncConsumesActionableManifestOutcome],
  ['cliTrace.scanDoesNotUseGenericProjectionContinuation', checks.cliTrace.scanDoesNotUseGenericProjectionContinuation],
  ['cliTrace.syncDoesNotUseGenericProjectionContinuation', checks.cliTrace.syncDoesNotUseGenericProjectionContinuation],
  ['cliTrace.activeCommandsDoNotUseCompilerBridge', checks.cliTrace.activeCommandsDoNotUseCompilerBridge],
  ['generatorTrace.generatorHasExplicitOperationInterface', checks.generatorTrace.generatorHasExplicitOperationInterface],
  ['generatorTrace.generatorOutcomeOwnsFollowUpOperation', checks.generatorTrace.generatorOutcomeOwnsFollowUpOperation],
  ['generatorTrace.generatorBlocksWithoutContractIRProducer', checks.generatorTrace.generatorBlocksWithoutContractIRProducer],
  ['publicRuntimeExports.coreIndexExportsManifestRuntimeTypes', checks.publicRuntimeExports.coreIndexExportsManifestRuntimeTypes],
  ['publicRuntimeExports.coreUpstreamExportsManifestRuntimeTypes', checks.publicRuntimeExports.coreUpstreamExportsManifestRuntimeTypes],
  ['publicRuntimeExports.cliIndexExportsCodegenOperation', checks.publicRuntimeExports.cliIndexExportsCodegenOperation],
];
const failed = requiredChecks.filter(([, passed]) => !passed).map(([name]) => name);
const reportPath = path.join(root, 'reports/PHASE3130_UPSTREAM_CLI_MANIFEST_GENERATOR_TRACE.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify({ report: path.relative(root, reportPath), checks, failed }, null, 2));
if (failed.length) process.exitCode = 1;
