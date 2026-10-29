const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const legacyActionScannerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/controller/actionScanner.ts');
const subscannerBarrelPath = path.join(root, 'packages/core/src/compiler/scanner/operations/controller/index.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const legacyActionScanner = fs.readFileSync(legacyActionScannerPath, 'utf8');
const subscannerBarrel = fs.readFileSync(subscannerBarrelPath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const resolverStart = resolver.indexOf('export function resolveControllerActionContract(');
const resolverEnd = resolver.indexOf('\nexport function schemaRequestEvidence(', resolverStart);
const resolverBody = resolver.slice(resolverStart, resolverEnd);
const checks = [
  ['resolver is a projection-only function', resolverStart >= 0 && resolverEnd > resolverStart],
  ['resolver does not invoke semantic authorities', !/\.judge\(|\.produce\(|\.project\(/.test(resolverBody)],
  ['resolver does not classify resource candidates', !/resourceBindingAuthority|resourceReturnSourceEvidenceProjection|ControllerResourceBindingJudgment/.test(resolverBody)],
  ['resolver does not derive dependencies', !/resolveConstructorDependencies|resolveMethodDependencies|dependencySemanticJudgmentAuthority/.test(resolverBody)],
  ['action contract module has no scanner subscanner imports', !/from ['"].*operations\//.test(resolver)],
  ['existing response authority is wired before resolver', wiring.indexOf('responseReferenceJudgmentAuthority.judge(') < wiring.indexOf('actionContractResolver.resolve(')],
  ['existing return producer is wired before resolver', wiring.indexOf('returnSemanticProduction.produce(') < wiring.indexOf('actionContractResolver.resolve(')],
  ['existing resource authority is wired before resolver', wiring.indexOf('resourceBindingAuthority.judge(') < wiring.indexOf('actionContractResolver.resolve(')],
  ['existing schema authority is wired before resolver', wiring.indexOf('schemaSemanticJudgmentAuthority.judge(') < wiring.indexOf('actionContractResolver.resolve(')],
  ['existing dependency authority is wired before resolver', wiring.indexOf('resolveControllerDependencyProducts(') < wiring.indexOf('actionContractResolver.resolve(')],
  ['upstream resolver interface claims projection-only ownership', contract.includes("readonly ownership: 'projects-already-closed-upstream-judgments-without-semantic-derivation';")],
  ['legacy action scanner entry is retired and empty of executable code', !/\bexport\s+(?:function|const|class)\b/.test(legacyActionScanner)],
  ['controller subscanner barrel no longer exports legacy action scanner', !/actionScanner/.test(subscannerBarrel)],
  ['subscanner retirement contract records action scanner as emptied', /emptiedControllerModules: readonly \['actionScanner\.ts'/.test(retirement) && !/nonEmptyControllerModules: readonly \[\s*'actionScanner\.ts'/.test(retirement)],
  ['no semantic foundation added to action path', !/semantic\/foundation/.test(resolver + wiring + contract)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
