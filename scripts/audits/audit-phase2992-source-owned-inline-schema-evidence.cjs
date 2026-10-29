const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['body judgment publishes source-owned inline evidence', () => read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts').includes('inlineSchemaEvidence: ControllerInlineSchemaEvidence')],
  ['body authority classifies source validation evidence once', () => {
    const source = read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts');
    return source.includes('input.body.validations.length === 0') && source.includes("kind: 'no_inline_validation_evidence'") && source.includes("kind: 'inline_validation_evidence'");
  }],
  ['schema authority does not inspect schema collection cardinality', () => {
    const source = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
    return !source.includes('evidenceCollections') && !source.includes('entries.length === 0');
  }],
  ['schema authority receives the evidence discriminant', () => read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts').includes('readonly inlineSchemaEvidence: ControllerInlineSchemaEvidence')],
  ['schema ADT exposes a domain operation', () => read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts').includes('deriveFormRequestSchema')],
  ['runtime wiring forwards the exact evidence object', () => read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts').includes('inlineSchemaEvidence: bodyJudgment.inlineSchemaEvidence')],
  ['controller contract regression helper forwards the evidence', () => read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.phase10.test.ts').includes('inlineSchemaEvidence: bodyJudgment.inlineSchemaEvidence')],
  ['body interface and implementation contract versions agree', () => read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts').includes('readonly contractVersion: 6') && read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts').includes('contractVersion: 6')],
  ['schema interface and implementation contract versions agree', () => read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts').includes('readonly contractVersion: 4') && read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts').includes('contractVersion: 4')],
  ['CLI scan operation has an explicit runtime interface', () => read('packages/cli/src/manifestScanOperationInterface.ts').includes('RouteSyncCliManifestScanOperationInterface')],
  ['CLI composition invokes the interface-backed scan operation', () => read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts').includes('routeSyncCliManifestScanOperationFactory.create(controllerInvocationManifestCompositionAuthority).scan(input)')],
  ['manifest serializer retains request body schema', () => read('packages/cli/src/generators/ManifestSerializer.ts').includes('schema: serialized.request.body.schema')],
  ['changed runtime modules introduce no export function declaration', () => ![
    read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts'),
    read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts'),
    read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts')
  ].some(source => /export\s+function\s/.test(source))]
];
let failures = 0;
for (const [name, check] of checks) {
  const passed = check();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures ? 1 : 0;
