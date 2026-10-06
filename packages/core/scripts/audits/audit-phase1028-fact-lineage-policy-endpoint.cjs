const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const policy = fs.readFileSync(
  path.join(root, 'src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts'),
  'utf8',
);
const upstream = fs.readFileSync(
  path.join(root, 'src/types/dataflow/dataFlowInterface.ts'),
  'utf8',
);
const semantic = fs.readFileSync(
  path.join(root, 'src/types/upstream/semanticDataflowInterface.ts'),
  'utf8',
);

const checks = {
  policyMatchesLineageIdentity:
    /fact\.lineage\.identity/.test(policy),
  policyDoesNotMatchFactEndpoints:
    !/identityKey\(fact\.source\).*identityKey\(fact\.target\)/s.test(policy),
  policyStillRejectsDerivedReaches:
    /fact\.kind === 'reaches' \|\| fact\.lineage === undefined/.test(policy),
  upstreamStillExecutionOnly:
    /DataFlowSourceInterface[\s\S]*DataFlowStepInterface[\s\S]*DataFlowFixpointInterface[\s\S]*DataFlowQueryInterface/.test(upstream)
    && !/isSource|isSink|isAdditionalFlowStep|isBarrier/.test(upstream),
  factLineageStillProducerScoped:
    /readonly producer: 'route' \| 'controller' \| 'model_relation' \| 'resource' \| 'schema'/.test(semantic),
};

const output = {
  phase: 1028,
  checks,
  clean: Object.values(checks).every(Boolean),
};

const outputPath = path.join(__dirname, 'PHASE1028_FACT_LINEAGE_POLICY_ENDPOINT.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (!output.clean) process.exit(1);
