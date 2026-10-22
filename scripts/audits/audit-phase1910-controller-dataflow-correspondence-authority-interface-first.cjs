const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceAuthority.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const checks = [
  ['correspondence authority is an explicit upstream interface with a closed judgment', /ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface/.test(contract) && /binding_payload_correspondence_matched/.test(contract) && /binding_payload_correspondence_missing/.test(contract) && /binding_payload_correspondence_ambiguous/.test(contract)],
  ['authority correlates canonical semantic source identity and exact span', /input\.binding\.source\.filePath\.value/.test(authority) && /input\.binding\.source\.span\.start\.value/.test(authority) && /input\.binding\.source\.span\.end\.value/.test(authority)],
  ['authority contract version 2 is wired at the composition root', /contractVersion: 2/.test(read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceAuthority.ts')) && /controllerDataflowBindingPayloadCorrespondenceAuthority/.test(wiring) && /correspondenceAuthority\.judge/.test(analyzer)],
  ['analyzer no longer contains local correspondence matching logic', !/const correlateBindingPayload/.test(analyzer) && !/const sameSourceSpan/.test(analyzer)],
  ['analyzer keeps matched-only expression projection and explicit outcomes in model', /binding_payload_correspondence_matched/.test(analyzer) && /bindingPayloadCorrespondence/.test(analyzer) && /bindingPayloadCorrespondence/.test(read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts'))],
  ['no fabricated unsupported AST fallback is reintroduced', !/PhpAstFactory\.unsupported/.test(analyzer)],
  ['canonical invocation judgment and integrated response remain separate retained values', /invocationSemanticIntegratedResponse/.test(model) && /invocationJudgment/.test(model) && /invocationSemanticIntegratedResponse, invocationJudgment: judgment/.test(analyzer)],
  ['scanner contract is v76 and discloses remaining origin/projection work', /readonly version: 76/.test(scannerInterface) && /version: 76,/.test(scannerInterface) && /variable-origin judgment and AST projection remain pending/.test(scannerInterface)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
