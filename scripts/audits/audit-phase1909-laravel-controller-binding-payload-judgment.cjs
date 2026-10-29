const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const model = read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const astTypes = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['closed matched/missing/ambiguous upstream judgment exists', ['binding_payload_correspondence_matched', 'binding_payload_correspondence_missing', 'binding_payload_correspondence_ambiguous'].every((kind) => model.includes(kind))],
  ['judgment model remains upstream and PHP-AST-agnostic', !model.includes('PhpAst') && model.includes('SourceSpan')],
  ['controller AST retains correspondence outcomes', astTypes.includes('bindingPayloadCorrespondence') && astTypes.includes('ControllerDataflowBindingPayloadCorrespondenceJudgment')],
  ['analyzer correlates canonical source file and offsets', ['left.file.value.value', 'left.start.value', 'left.end.value'].every((field) => analyzer.includes(field))],
  ['synthetic unsupported-expression fallback removed', !analyzer.includes('fallbackValue') && !analyzer.includes('PhpAstFactory.unsupported')],
  ['only matched payloads produce variable definitions', analyzer.includes('binding_payload_correspondence_matched') && analyzer.includes('canonicalDefinition(outcome.binding, outcome.payload')],
  ['exact invocation judgment and integrated response are retained', analyzer.includes('invocationSemanticIntegratedResponse') && analyzer.includes('invocationJudgment: judgment')],
  ['scanner boundary contract version is 75 and states outcome retention', scannerContract.includes('readonly version: 75;') && scannerContract.includes('controllerDataflowCorrespondenceOutcomeShape')],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!pass);
}
process.exitCode = failures === 0 ? 0 : 1;
