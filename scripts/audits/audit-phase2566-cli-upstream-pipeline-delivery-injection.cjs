const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const delivery = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const pipeline = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const coreBarrel = read('packages/core/src/index.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['upstream owns an explicit source-pipeline delivery interface', /interface PhpSourceInvocationSemanticPipelineDeliveryInterface/.test(delivery)],
  ['delivery contract models a named typed operation', /readonly deliver:[\s\S]*?PhpSourceInvocationSemanticPipelineResult\[\][\s\S]*?PhpSourceInvocationSemanticPipelineDeliveryBatch/.test(delivery)],
  ['operation is exported as a named const typed by its interface', /export const phpSourceInvocationSemanticPipelineDelivery:\s*PhpSourceInvocationSemanticPipelineDeliveryInterface/.test(delivery)],
  ['delivery preserves the exact source-bound result entries', /entries: Object\.freeze\(\[\.\.\.entries\]\)/.test(delivery)],
  ['upstream compatibility function delegates to the named operation', /phpSourceInvocationSemanticPipelineDelivery\.deliver\(entries\)/.test(delivery)],
  ['upstream public barrels expose delivery interface and operation', /phpSourceInvocationSemanticPipelineDeliveryInterface/.test(coreBarrel) && /phpSourceInvocationSemanticPipelineDeliveryInterface/.test(upstreamBarrel)],
  ['CLI composition dependency requires the delivery operation', /readonly sourceInvocationPipelineDelivery:\s*PhpSourceInvocationSemanticPipelineDeliveryInterface/.test(contract)],
  ['CLI composition uses injected delivery rather than hidden module call', /dependencies\.sourceInvocationPipelineDelivery\.deliver\(/.test(composition) && !/phpSourceInvocationSemanticPipelineDeliveryBatchFromResults/.test(composition)],
  ['default CLI composition explicitly wires upstream delivery operation', /sourceInvocationPipelineDelivery:\s*phpSourceInvocationSemanticPipelineDelivery/.test(composition)],
  ['CLI semantic pipeline batch wrapper uses the same named operation', /phpSourceInvocationSemanticPipelineDelivery\.deliver\(/.test(pipeline) && !/phpSourceInvocationSemanticPipelineDeliveryBatchFromResults/.test(pipeline)],
  ['reasoning contract declares the delivery transition and increments version', /version: 11/.test(composition) && /deliver-source-bound-pipeline-results-through-the-injected-upstream-delivery-operation/.test(composition) && /readonly version: 11/.test(contract)],
  ['changed active path avoids semantic foundation and relations imports', !/semantic\/(?:foundation|relations)/.test(delivery + composition + contract + pipeline)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['delivery contract', delivery], ['composition implementation', composition], ['composition contract', contract], ['pipeline wrapper', pipeline]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  if (!passed) failures += errors.length;
}
console.log(`Phase 2566: ${checks.length + 4 - failures}/${checks.length + 4} assertions passed.`);
process.exitCode = failures ? 1 : 0;
