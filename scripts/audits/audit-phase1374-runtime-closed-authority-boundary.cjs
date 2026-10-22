const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const boundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const pipeline = read('packages/core/src/compiler/analysis/semanticDataflowPipeline.ts');
const policy = read('packages/core/src/compiler/analysis/dataflow/semanticDataflowStatePolicy.ts');
const integrationTest = read('packages/core/src/compiler/analysis/__tests__/ecommerceShopDataflowPolicyPhase1029.spec.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const semanticDataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const composition = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const operationIdentity = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const manifestProjection = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graphProjection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const react = read('packages/react/src/hooks/createHooks.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const cli = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const packageJson = JSON.parse(read('package.json'));

check('runtime adapter returns the read-only DataFlowAuthorityInterface',
  /import type \{ DataFlowAuthorityInterface \}/.test(adapter) && /export type SemanticDataflowDataFlowInterface = DataFlowAuthorityInterface</.test(adapter),
  'The downstream runtime surface is typed as closed authority, not producer execution algebra.');
check('runtime adapter invokes the upstream judgment contract',
  /authority: SemanticDataflowReasoningAuthorityInterface/.test(adapter) && /const state = authority\.judge\(input\)/.test(adapter),
  'Semantic judgment is produced by the injected upstream authority.');
check('runtime adapter does not expose fake seed execution',
  !/\bseed\s*:/.test(adapter),
  'A closed result is not misrepresented as an executable seed producer.');
check('runtime adapter does not expose fake derive execution',
  !/\bderive\s*:/.test(adapter),
  'Downstream cannot request derivation that merely returns the same closed state.');
check('runtime adapter does not expose fake close execution',
  !/\bclose\s*:/.test(adapter),
  'Downstream cannot request closure that merely returns the same closed state.');
check('runtime adapter does not expose a judgment identity function',
  !/\bjudge\s*:/.test(adapter),
  'The judge operation belongs to the upstream authority contract, not the downstream projection.');
check('runtime adapter does not import the concrete solver',
  !/createSemanticDataflowJudgment/.test(adapter),
  'Only upstream authority owns the solver binding.');
check('runtime adapter preserves the exact upstream proof contract',
  /reasoning: state\.reasoningContract/.test(adapter),
  'The projection forwards reasoning proof instead of minting or reconstructing it.');
check('runtime adapter exposes the canonical closed judgment state',
  /state,/.test(adapter) && /closed: true/.test(adapter),
  'Consumers receive the authoritative state and closed marker.');
check('reachability query compares canonical semantic identities',
  /semanticDataflowIdentityEqual\(fact\.source, source\)/.test(adapter) && /semanticDataflowIdentityEqual\(fact\.target, target\)/.test(adapter),
  'Query behavior uses the upstream identity contract rather than a local identity classifier.');
check('runtime boundary projects to authority-only output',
  /DataFlowAuthorityInterface</.test(boundary) && /UpstreamWiringInterface</.test(boundary),
  'The wiring contract separates upstream input from the read-only downstream authority.');
check('analysis result exposes authority-only interface',
  /readonly interface: DataFlowAuthorityInterface</.test(pipeline),
  'Analysis consumers cannot accidentally depend on producer-only methods.');
check('state policy already consumes authority-only contract',
  /dataflow: DataFlowAuthorityInterface</.test(policy),
  'Policy queries are compatible with the narrower canonical runtime surface.');
check('integration test reads fixed-point status from canonical state',
  /analysis\.interface\.state\.fixedPoint/.test(integrationTest) && !/analysis\.interface\.judgment\.fixedPoint/.test(integrationTest),
  'The test checks the state actually declared by the authority contract.');
check('upstream authority remains the only solver binding',
  /semanticDataflowReasoningAuthority[\s\S]*judge: createSemanticDataflowJudgment/.test(authority),
  'The concrete solver is bound once in the upstream authority.');
check('domain authority contract specializes shared reasoning judgment',
  /SemanticDataflowReasoningAuthorityInterface\s+extends SemanticReasoningJudgmentInterface<SemanticDataflowInput, SemanticDataflowJudgment>/.test(semanticDataflow),
  'Dataflow uses the shared reasoning interface with canonical ADT input/output.');
check('composition root selects the canonical upstream implementation',
  /createSemanticDataflowDataFlowInterface\(input, semanticDataflowReasoningAuthority\)/.test(composition),
  'Concrete authority selection stays in runtime composition, not in the adapter.');
check('AST dataflow remains aliases of canonical ADTs',
  /type AstDataflowInput = SemanticDataflowInput/.test(astDataflow) && /type AstDataflowJudgment = SemanticDataflowJudgment/.test(astDataflow),
  'No second AST-specific input or judgment model was introduced.');
check('operation identity remains a separate canonical capability contract',
  /OperationIdentityCapabilityRuntimeAlgebraInterface/.test(operationIdentity) && /algebra\.fromRoute\(input\)/.test(operationAuthority) && /createOperationIdentityCapabilityAuthority/.test(operationAuthority),
  'The change does not collapse route identity capability into dataflow semantics.');
check('manifest projection forwards evidence rather than solving it',
  /dataflowInputs: manifest\.dataflowInputs/.test(manifestProjection) && !/createSemanticDataflowJudgment/.test(manifestProjection),
  'Manifest remains a source/wiring surface, not a semantic solver.');
check('IR projects canonical closed state',
  /dataflow\.state\.closure/.test(irProjection) && !/createSemanticDataflowJudgment/.test(irProjection),
  'IR consumes the completed closure.');
check('structural graph retains its distinct relation projection',
  /StructuralSemanticRelation/.test(graphProjection) && /createGraphEdgeRelation/.test(graphProjection),
  'Structural graph semantics remain distinct from runtime dataflow.');
check('React, SDK, and CLI continue to consume endpoint capability contracts',
  /hookKind/.test(react) && /missing the upstream operation identity projection/.test(sdk) && /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(cli),
  'Downstream endpoint consumers are unchanged and do not reclassify identity.');
check('semantic ownership coverage and prior audit chain remain present',
  exists('scripts/audit/semantic-ownership-coverage.cjs') && exists('scripts/audits/audit-phase1373-reasoning-judgment-interface-composition.cjs') && exists('scripts/audits/audit-phase1372-runtime-semantic-contract-execution.cjs'),
  'Focused checks extend rather than replace the ownership and prior-phase audits.');
check('release/build contract remains unchanged',
  packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown' && packageJson.scripts['audit:phase1374-runtime-closed-authority-boundary'] === 'node scripts/audits/audit-phase1374-runtime-closed-authority-boundary.cjs',
  'The audit is reproducible without changing package version or build command.');

const report = {
  phase: 1374,
  title: 'Runtime Closed Authority Boundary',
  scope: [
    'upstream SemanticDataflowReasoningAuthorityInterface and SemanticDataflowJudgment ADT',
    'DataFlowAuthorityInterface vs DataFlowInterface execution/consumer surfaces',
    'runtime adapter, boundary, analysis result, and query-policy consumers',
    'operation identity, AST aliases, manifest, graph, IR, SDK, React, and CLI regression boundaries',
  ],
  checks: checks.length,
  passed: checks.filter(item => item.passed).length,
  failed: checks.filter(item => !item.passed).length,
  results: checks,
  decision: {
    area: 'Runtime dataflow boundary',
    change: 'Expose DataFlowAuthorityInterface rather than DataFlowInterface from the closed semantic-dataflow runtime adapter.',
    reason: 'The authority result is already closed upstream. Seed/derive/close methods that merely replay or return the same judgment falsely advertise producer execution capabilities and invite downstream misuse.',
    preserved: 'The canonical upstream solver, semantic proof, closed judgment, identity-based reaches query, and composition root remain unchanged.',
  },
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1374-runtime-closed-authority-boundary.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0) process.exitCode = 1;
