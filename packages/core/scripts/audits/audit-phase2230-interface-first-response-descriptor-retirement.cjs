const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const action = read('src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const retiredResolver = read('src/compiler/scanner/subscanners/controller/responseAttributeScanner.ts');
const actionInterface = read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const actionWiring = read('src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const controllerScanner = read('src/compiler/scanner/wiring/laravelControllerScanner.ts');
const responseScanner = read('src/compiler/scanner/subscanners/responseScanner.ts');
const retirementInterface = read('src/types/upstream/laravelSubscannerRetirementInterface.ts');
const checks = [
  ['action contract no longer owns ResponseDescriptor', !/readonly response: ResponseDescriptor/.test(action)],
  ['action contract no longer calls the legacy resolver', !/resolveResponseAttributeAst|function resolveResponse\(/.test(action)],
  ['legacy response-attribute module exports no resolver implementation', !/export function resolveResponseAttributeAst|resolveClassFile|readResponseDtoAnalysis/.test(retiredResolver)],
  ['existing integrated response interface remains the semantic authority', /LaravelControllerResponseSemanticPipelineInterface/.test(actionInterface) && /judgeIntegratedResponse/.test(read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts'))],
  ['scanner publishes integrated response judgment', /responseSemanticPipeline\.judgeIntegratedResponse/.test(controllerScanner) && /responseJudgment/.test(controllerScanner)],
  ['response scanner consumes correlated method products', /artifact\.responseJudgment\.product\.firstMethod/.test(responseScanner) && /methodResponseAstProjection\.project/.test(responseScanner)],
  ['action interface and composition versions are synchronized at 31', /readonly version: 31;/.test(actionInterface) && /version: 31 as const/.test(actionWiring)],
  ['response descriptor obligation is removed from action coverage', !/response_descriptor_resolution/.test(actionInterface) && /response-descriptor-resolution-is-retired/.test(actionInterface)],
  ['subscanner retirement interface marks response attribute module emptied', /responseAttributeScanner\.ts/.test(retirementInterface) && /three-empty-modules/.test(retirementInterface) && !/readonly nonEmptyControllerModules[\s\S]*?responseAttributeScanner\.ts/.test(retirementInterface)],
  ['no relation/foundation imports added to action authority path', !/semantic\/(relations|foundation)\//.test(action + actionInterface + actionWiring)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
