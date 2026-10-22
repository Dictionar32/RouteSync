const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const boundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const composition = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const analysis = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const manifestSurface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const materializerTypes = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const materializerImpl = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const authority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const legacyAnalyzer = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const pkg = JSON.parse(read('package.json'));

check('runtime boundary accepts closed judgment', boundary.includes('SemanticDataflowJudgment') && !boundary.includes('SemanticDataflowInput'), 'runtime boundary input is a judgment, not raw semantic input');
check('runtime composition does not call semantic authority', !composition.includes('semanticDataflowReasoningAuthority') && !composition.includes('.judge('), 'runtime composition only projects through adapter');
check('manifest analysis reads judgment sequence', analysis.includes('manifest.dataflowJudgments') && !analysis.includes('manifest.dataflowInputs'), 'analysis consumes upstream-closed judgments');
check('missing judgment fails closed', analysis.includes('Missing upstream-closed dataflow judgment') && analysis.includes('throw new Error'), 'no fallback re-judgment from raw input');
check('upstream manifest surface owns initial reasoning', manifestSurface.includes('semanticDataflowReasoningAuthority.judge(inputs.head)'), 'initial judgment construction remains upstream-owned');
check('materializer interface is explicit', materializerTypes.includes('interface OperationIdentityCapabilityContractMaterializerInterface') && materializerTypes.includes('materialize(input: OperationIdentityCapabilityInput)'), 'materialize contract makes already-resolved input intent explicit');
check('canonical materializer only seals provided evidence', materializerImpl.includes('operationIdentityCapabilityContractMaterializer') && materializerImpl.includes('reasoning,') && materializerImpl.includes('derivation: input.derivation') && materializerImpl.includes('provenance: input.provenance') && !materializerImpl.includes('routeRole(') && !materializerImpl.includes('actionRole('), 'materializer carries evidence/proof without route classification');
check('authority delegates to materializer', authority.includes('materializer.materialize(input)') && authority.includes('operationIdentityCapabilityContractMaterializer'), 'authority is composition around canonical materializer');
check('route producer uses canonical materialize API', producer.includes('materializeOperationIdentityCapability(boundary.capability)') && !producer.includes('operationIdentityCapabilityFromRoute'), 'producer uses explicit materialize entry point');
check('legacy fromRoute is deprecated compatibility only', materializerTypes.includes('@deprecated Use materialize') && materializerImpl.includes('@deprecated Compatibility facade'), 'legacy naming remains available but is not canonical');
check('legacy AST analyzer is explicitly deprecated', legacyAnalyzer.includes('@deprecated Compatibility facade') && legacyAnalyzer.includes('semanticDataflowReasoningAuthority.judge(input)'), 'legacy scanner facade still reasons; do not mistake it for runtime path');
check('package version/build script preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown', `version=${pkg.version}; build=${pkg.scripts.build}`);

const failed = checks.filter((entry) => !entry.pass);
for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.name}: ${entry.detail}`);
console.log(`\nPhase 1384 audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
