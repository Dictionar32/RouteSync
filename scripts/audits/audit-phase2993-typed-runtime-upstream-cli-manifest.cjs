const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const checks = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const check = (name, pass, evidence) => checks.push({ name, pass: Boolean(pass), evidence });

const scanCommand = read('packages/cli/src/commands/scan.ts');
const cliScanInterface = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionInterface = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const schemaAuthority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const schemaInterface = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const bodyAuthority = read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts');
const executionWiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const contract = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');

check('CLI command factory is interface-typed runtime object', /export const createScanCommand:\s*ScanCommandFactoryInterface\s*=\s*Object\.freeze\(/.test(scanCommand), 'commands/scan.ts');
check('CLI manifest scan operation factory is interface-typed runtime object', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliScanInterface), 'manifestScanOperationInterface.ts');
check('CLI builder is interface-typed runtime object', /export const controllerInvocationManifestBuilder:\s*ControllerInvocationManifestBuilderInterface\s*=\s*Object\.freeze\(/.test(composition), 'controllerInvocationManifestComposition.ts');
check('CLI builder delegates to typed scan operation', /routeSyncCliManifestScanOperationFactory\.create\(controllerInvocationManifestCompositionAuthority\)\.scan\(input\)/.test(composition), 'builder -> scan operation');
check('Manifest ADT exposes domain-owned terminal continuation', /continueForDriftAudit/.test(compositionInterface) && /scannedManifest\.continueForDriftAudit\(/.test(scanCommand), 'composition ADT -> CLI handlers');
check('Source body judgment owns inline schema evidence', /inlineSchemaEvidence/.test(bodyAuthority) && /inlineSchemaEvidence/.test(executionWiring), 'body authority -> execution wiring');
check('Schema authority consumes source-owned evidence', /inlineSchemaEvidence:\s*ControllerInlineSchemaEvidence/.test(schemaInterface) && /formRequestDerivation\(input\.inlineSchemaEvidence/.test(schemaAuthority), 'schema interface -> authority');
check('Controller contract publishes schema from schema judgment', /schema:\s*context\.schemaSemanticJudgment\.derivation\.schema/.test(contract), 'schema judgment -> controller contract');
check('Controller execution publishes semantic schema', /schema:\s*schemaSemanticJudgment\.derivation\.schema/.test(executionWiring), 'schema judgment -> semantic publication');
check('Manifest serializer preserves request body schema', /schema:\s*serialized\.request\.body\.schema/.test(serializer), 'route contract serialization');
check('IR projection consumes closed dataflow authority interface', /DataFlowAuthorityInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(irProjection) && /dataflow\.state\.closure/.test(irProjection), 'dataflow interface -> IR projection');
check('Known schema-to-route-manifest bridge remains explicitly unproven', true, 'No field-by-field source edge asserted by this audit; see report');

const targetedFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts',
  'packages/cli/src/generators/ManifestSerializer.ts',
  'packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts',
  'packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts',
  'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts',
  'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts',
  'packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts',
];
for (const file of targetedFiles) {
  const source = read(file);
  check(`${file}: no exported function declaration`, !/^\s*export\s+(?:async\s+)?function\s+/m.test(source), 'runtime-path export style');
}

const failed = checks.filter((item) => !item.pass);
const result = {
  phase: 2993,
  title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations: upstream → CLI → manifest trace',
  checkCount: checks.length,
  passed: checks.length - failed.length,
  failed: failed.length,
  checks,
  limitations: [
    'This is a structural source audit, not a full TypeScript typecheck or runtime integration test.',
    'Controller schema provenance into RouteManifest.request.body.schema remains unproven field-by-field.',
    'The audit does not claim that every exported helper in core/src/types/upstream is on the runtime path.'
  ]
};
fs.writeFileSync(path.join(root, 'PHASE2993_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ phase: result.phase, checkCount: result.checkCount, passed: result.passed, failed: result.failed, failures: failed }, null, 2));
if (failed.length) process.exitCode = 1;
