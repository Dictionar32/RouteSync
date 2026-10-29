const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const astTypes = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowVariableIdentityAuthority.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['typed identity authority interface exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/controllerDataflowVariableIdentityInterface.ts'))],
  ['identity judgment has resolved/missing/ambiguous outcomes', /controller_dataflow_variable_identity_resolved/.test(authority) && /controller_dataflow_variable_identity_missing/.test(authority) && /controller_dataflow_variable_identity_ambiguous/.test(authority)],
  ['identity compares canonical source identity and span', /identity\.source\.filePath\.value/.test(authority) && /identity\.source\.span\.start\.value/.test(authority) && /identity\.source\.span\.end\.value/.test(authority)],
  ['analyzer delegates identity resolution upstream', /variableIdentityAuthority\.resolve\(/.test(analyzer)],
  ['opaque slot fallback removed from analyzer', !/identifierFromKnowledge|id\.identity\.slot\.value/.test(analyzer)],
  ['identity judgments retained in dataflow AST', /variableIdentityJudgments/.test(analyzer) && /variableIdentityJudgments/.test(astTypes)],
  ['production wiring injects identity authority', /controllerDataflowVariableIdentityAuthority/.test(wiring)],
  ['upstream barrel exports interface and authority', /controllerDataflowVariableIdentityInterface/.test(index) && /controllerDataflowVariableIdentityAuthority/.test(index)],
  ['scanner boundary contract version 79 records identity ownership', /readonly version: 79/.test(contract) && /controllerDataflowVariableIdentityBoundary/.test(contract)],
  ['invocation judgment and integrated response remain separate', /invocationSemanticIntegratedResponse, invocationJudgment: judgment/.test(analyzer)],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
