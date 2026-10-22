const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['upstream attribute scanner remains the single v18 contract', () => {
    const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
    const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
    return contract.includes('readonly contractVersion: 18;')
      && pipeline.includes("contractVersion: 18,")
      && pipeline.includes('satisfies LaravelAttributeScannerInterface');
  }],
  ['CLI scan enters the invocation composition', () =>
    read('packages/cli/src/commands/scan.ts').includes('buildManifestWithInvocationPipeline(sourceProject, routeSourceSelection)')],
  ['manifest builder consumes the source AST pipeline judgment', () => {
    const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
    return builder.includes('laravelSourceAstPipeline.execute(invocationInventoryReceipt, routeSourceSelection)')
      && builder.includes("projection.kind === 'laravel_source_ast_projection_complete'")
      && builder.includes("projection.kind === 'laravel_source_ast_projection_attribute_scan_blocked'");
  }],
  ['attribute producer publishes complete-or-blocked closed judgment', () => {
    const contract = read('packages/core/src/compiler/scanner/attributeProducerInterface.ts');
    const producer = read('packages/core/src/compiler/scanner/attributeProducer.ts');
    return contract.includes('export type AttributeProducerJudgment =')
      && contract.includes("kind: 'attribute_producer_complete'")
      && contract.includes("kind: 'attribute_producer_blocked'")
      && producer.includes("kind: 'attribute_producer_constructor_missing'");
  }],
  ['constructor lookup is recorded as open rather than misrepresented as upstream authority', () => {
    const producer = read('packages/core/src/compiler/scanner/attributeProducer.ts');
    const declarationAuthority = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
    return producer.includes("methods.find(method => method.name === '__construct')")
      && declarationAuthority.includes('controller_action_excluded')
      && !declarationAuthority.includes('controller_constructor_selected');
  }],
  ['no forbidden foundation import is introduced in the scanner contract path', () => {
    const files = [
      'packages/core/src/types/upstream/laravelAttributeScannerInterface.ts',
      'packages/core/src/compiler/scanner/attributeProducerInterface.ts',
      'packages/core/src/compiler/scanner/attributeProducer.ts',
      'packages/core/src/compiler/scanner/laravelAttributeScanner.ts',
      'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts',
    ];
    return files.every(file => !read(file).includes('semantic/foundation'));
  }],
];

let failed = false;
for (const [name, check] of checks) {
  const passed = check();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
