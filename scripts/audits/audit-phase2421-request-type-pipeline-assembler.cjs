const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const assemblerPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const activeLoweringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const projectionPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const source = fs.readFileSync(assemblerPath, 'utf8');
const activeLowering = fs.readFileSync(activeLoweringPath, 'utf8');
const authorityProjection = fs.readFileSync(projectionPath, 'utf8');
const checks = [
  ['uses existing upstream pipeline assembler interface', source.includes('RequestTypeDerivationSemanticPipelineAssemblerInterface')],
  ['validates reasoning contract identity', source.includes("mismatch('reasoning', composition.contract, composition.reasoning.contract)")],
  ['validates verifier contract identity', source.includes("mismatch('verifier', composition.contract, composition.verifier.contract)")],
  ['validates decision contract identity', source.includes("mismatch('decision', composition.contract, composition.decision.contract)")],
  ['validates authority contract identity', source.includes("mismatch('authority', composition.contract, composition.authority.contract)")],
  ['reasoning is the source-evidence inference operation', source.includes('composition.reasoning.infer(input)')],
  ['verification consumes the exact inference packet', source.includes('composition.verifier.verify(inference)')],
  ['coverage uses existing upstream coverage operation', source.includes('coverage.assess(verification.result)')],
  ['decision receives contract-bound premises', source.includes('composition.decision.decide({') && source.includes('inference,\n        verification,\n        coverage: coverageEvidence')],
  ['authority receives original input and closed candidate', source.includes('composition.authority.evaluate(input, candidate)')],
  ['assessment integrity validator is bound to the canonical contract', source.includes('createRequestTypeDerivationSemanticAssessmentValidator(composition.contract)')],
  ['assembler returns typed rejection instead of partial pipeline', source.includes("{ kind: 'rejected', mismatches }")],
  ['assembler returns a frozen pipeline only after contract validation', source.includes("{ kind: 'assembled', pipeline: assemblePipeline(composition) }")],
  ['new assembler does not depend on semantic relations or foundation', !/semantic\/(relations|foundation)/.test(source)],
  ['active lowering limitation remains explicitly traceable', activeLowering.includes('requestTypeDerivationProjectionPipeline.derive(')],
  ['authority-backed projection still requires an injected semantic pipeline', authorityProjection.includes('pipeline: RequestTypeDerivationSemanticPipelineInterface')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\nPhase2421 audit: ${checks.length - failures}/${checks.length} assertions passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
