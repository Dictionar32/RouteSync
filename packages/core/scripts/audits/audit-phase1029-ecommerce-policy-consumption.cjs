const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const test = fs.readFileSync(
  path.join(root, 'src/compiler/analysis/__tests__/ecommerceShopDataflowPolicyPhase1029.spec.ts'),
  'utf8',
);
const policy = fs.readFileSync(
  path.join(root, 'src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts'),
  'utf8',
);
const routeAnalysis = fs.readFileSync(
  path.join(root, 'src/compiler/analysis/routeSyncDataflowAnalysis.ts'),
  'utf8',
);
const upstream = fs.readFileSync(
  path.join(root, 'src/types/dataflow/dataFlowInterface.ts'),
  'utf8',
);
const manifestSurface = fs.readFileSync(
  path.join(root, 'src/types/upstream/semanticDataflowManifestSurface.ts'),
  'utf8',
);

const checks = {
  ecommerceFixtureUsed: /ecommerce-shop-source/.test(test),
  productionPolicyBoundaryUsed: /analyzeRouteSyncManifestDataflowWithPolicy\(manifest/.test(test),
  routeExplicitlySelectedAsSource: /sourceProducers: \['route'\]/.test(test),
  resourceExplicitlySelectedAsSink: /sinkProducers: \['resource'\]/.test(test),
  sourceAssertionsAreLineageScoped: /fact\.lineage\?\.producer === 'route'/.test(test),
  sinkAssertionsAreLineageScoped: /fact\.lineage\?\.producer === 'resource'/.test(test),
  canonicalReachabilityQueried: /semanticDataflowFlowsUnderPolicy/.test(test),
  policyDoesNotCreateEdges: /isAdditionalFlowStep: \(\) => false/.test(policy),
  routeAnalysisStillAppliesPolicyAfterClosure: /createSemanticDataflowAnalysisPolicy\(result\.analysis\.interface, context\)/.test(routeAnalysis),
  upstreamExecutionOnly: /DataFlowSourceInterface[\s\S]*DataFlowStepInterface[\s\S]*DataFlowFixpointInterface[\s\S]*DataFlowQueryInterface/.test(upstream)
    && !/isSource|isSink|isAdditionalFlowStep|isBarrier/.test(upstream),
  manifestRemainsSeedAssembly: /semanticDataflowInputsFromSourceModel/.test(manifestSurface)
    && !/createSemanticDataflowJudgment|createSemanticDataflowInterface|\.reaches\s*\(/.test(manifestSurface),
};

const output = {
  phase: 1029,
  checks,
  clean: Object.values(checks).every(Boolean),
};

const outputPath = path.join(__dirname, 'PHASE1029_ECOMMERCE_POLICY_CONSUMPTION.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (!output.clean) process.exit(1);
