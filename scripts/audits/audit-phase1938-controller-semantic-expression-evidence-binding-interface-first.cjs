const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const request = read('packages/core/src/types/upstream/controllerVariableSemanticInterface.ts');
const adapterInterface = read('packages/core/src/types/upstream/controllerVariableSemanticResolutionInputAdapterInterface.ts');
const adapter = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticResolutionInputAdapter.ts');
const projection = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts');
const semanticAuthority = read('packages/core/src/types/upstream/controllerVariableSemanticAuthority.ts');
const runtimeExecutor = read('packages/core/src/types/upstream/controllerVariableSemanticRuntimeExecutor.ts');
const dataflowAuthorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const tests = read('packages/core/src/types/upstream/__test__/controllerVariableSemanticAuthority.phase1547.test.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['canonical semantic request carries a typed Expression rather than reconstructing it from expressionValue', /readonly sourceExpression: Expression/.test(request) && /import type \{ Expression \} from '\.\/expression'/.test(request)],
  ['every closed semantic judgment variant retains sourceExpression', /kind: 'resolved'[\s\S]*sourceExpression: Expression/.test(request) && /kind: 'not_resolved'; readonly sourceExpression: Expression/.test(request) && /kind: 'contract_violation'[\s\S]*readonly sourceExpression: Expression/.test(request)],
  ['adapter interface advances and explicitly owns exact canonical-expression retention', /readonly contractVersion: 2/.test(adapterInterface) && /readonly version: 2/.test(adapterInterface) && /readonly sourceExpression: CanonicalExpression/.test(adapterInterface) && /exact-canonical-expression-that-produced-the-source-evidence/.test(adapterInterface)],
  ['PHP source adapter forwards the exact canonical expression without interpreting it', /sourceExpression: input\.sourceExpression/.test(adapter) && /controllerVariableSemanticEvidenceFromPhpAst\(input\.expression\)/.test(adapter)],
  ['definition projection supplies the same projected expression to semantic resolution', /const expression = dependencies\.expressionAuthority\.derive/.test(projection) && /const semanticResolution = dependencies\.executor\.execute/.test(projection) && /sourceExpression: expression/.test(projection) && /semanticResolution,/.test(projection)],
  ['upstream semantic authority preserves request sourceExpression on all outcomes', /sourceExpression: request\.sourceExpression/.test(semanticAuthority) && /resolvedJudgment\(rule, judgment\.value, request\.evidence, request\.sourceExpression\)/.test(semanticAuthority)],
  ['runtime executor forwards the existing judgment without rebuilding expression provenance', /sourceExpressionContract: 'every-closed-judgment-retains-the-exact-canonical-sourceExpression-reference-from-its-request'/.test(runtimeExecutor) && /authority\.resolve\(request\)/.test(runtimeExecutor)],
  ['controller dataflow authority contract declares expression-evidence binding', /readonly contractVersion: 13/.test(dataflowAuthorityInterface) && /semanticResolutionExpressionBinding/.test(dataflowAuthorityInterface) && /same-matched-payload-that-produced-syntax-neutral-evidence/.test(dataflowAuthorityInterface)],
  ['semantic model contract records expression judgment correlation', /readonly version: 11/.test(model) && /semanticResolutionExpressionBinding/.test(model)],
  ['Laravel scanner boundary documents upstream ownership without scanner-side reasoning', /readonly version: 101/.test(scanner) && /judgment-also-retains-the-exact-canonical-Expression/.test(scanner) && !/sourceExpression: expression/.test(read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts'))],
  ['focused semantic tests supply canonical expression and verify executor delegation', /const sourceExpression: Expression/.test(tests) && /sourceExpression,\s*evidence:/.test(tests) && /expect\(calls\)\.toEqual\(\[input\]\)/.test(tests)],
  ['audit command is registered and no new foundation dependency is introduced', Boolean(packageJson.scripts['audit:phase1938-controller-semantic-expression-evidence-binding-interface-first']) && !/semantic\/foundation/.test(request + adapterInterface + adapter + projection + semanticAuthority + dataflowAuthorityInterface + model + scanner)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
