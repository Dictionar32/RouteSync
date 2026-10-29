const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const reader = read('packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts');
const contract = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const terminal = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const checks = [
  ['CLI source-read composition has no try/catch', !/try\s*\{|catch\s*\(/.test(cli.slice(cli.indexOf('const discoveredSourceReadSettlementOperation'), cli.indexOf('interface DiscoveredSourcesContinuationOperationInterface')))],
  ['CLI maps Promise fulfillment and rejection into existing settlement ADT', /\.then\([\s\S]*?phpSourceDocumentReadOperationSettlementFactory\.fulfilled[\s\S]*?phpSourceDocumentReadOperationSettlementFactory\.rejected/.test(cli)],
  ['rejected settlement preserves original rejection reason', /readonly failure: unknown/.test(contract) && /rejected: \(sourceFile: SourceFile, failure: unknown\)/.test(contract)],
  ['batch ADT preserves rejected operation evidence', /readonly rejections: readonly PhpSourceDocumentReadOperationRejectedEvidence\[\]/.test(contract)],
  ['CLI terminal carries rejection evidence to domain continuation', /readonly rejections: readonly PhpSourceDocumentReadOperationRejectedEvidence\[\]/.test(terminal) && /rejections: rejectedBatch\.rejections/.test(cli)],
  ['filesystem reader uses promise outcome mapping, not try/catch', !/try\s*\{|catch\s*\(/.test(reader) && /fs\.readFile[\s\S]*?\.then\(/.test(reader)],
  ['read failures remain explicit source-read blocked ADTs at filesystem boundary', /phpSourceDocumentReadResultFactory\.blocked/.test(reader)],
  ['upstream collections remains empty', collections.length === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
