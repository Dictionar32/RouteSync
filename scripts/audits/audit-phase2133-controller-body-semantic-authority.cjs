const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const contract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['body semantic judgment has a dedicated upstream interface', /export interface ControllerBodySemanticJudgmentAuthorityInterface/.test(iface)],
  ['judgment has a closed discriminant', /kind: 'controller_body_semantic_judgment_completed'/.test(iface)],
  ['judgment retains the exact source identity', /readonly sourceIdentity: TSourceIdentity/.test(iface) && /body-judgment-retains-the-exact-source-identity-supplied-as-input/.test(iface)],
  ['judgment publishes domain SourceStatements', /readonly statements: SourceStatements/.test(iface)],
  ['judgment publishes schema and typed error descriptors', /readonly schema: RouteSchemaPayload/.test(iface) && /readonly errorResponses: readonly HttpErrorResponseDescriptor\[\]/.test(iface)],
  ['existing canonical AST boundary implements the authority', /controllerBodySemanticJudgmentAuthority:[\s\S]*?kind: 'controller_body_semantic_judgment_authority'/.test(canonical)],
  ['authority converts statements once into canonical source representation', /statements: controllerStatements\(input\.method\.body\.statements, input\.sourceIdentity\.value\.value, input\.method\)/.test(canonical)],
  ['authority owns canonical schema lowering from existing source-bound entries and preserves errors', /RouteSemanticFlowValidationRuleSet\.create\(validationEntries, TypeInterner\.create\(\)\)\.fields/.test(canonical) && /schema: createRouteSchemaPayload\(/.test(canonical) && /input\.body\.errors\.flatMap/.test(canonical) && !/resolveControllerBody/.test(canonical)],
  ['action contract invokes the authority with source-bound input', /controllerBodySemanticJudgmentAuthority\.judge\(\{ body: method\.body, method, sourceIdentity: sourceFile \}\)/.test(contract)],
  ['action contract retains the exact body judgment', /readonly bodySemanticJudgment: ControllerBodySemanticJudgment<SourceFile>/.test(contract) && /bodySemanticJudgment: bodyJudgment/.test(contract)],
  ['action semantic publication consumes the retained judgment', /statements: result\.contract\.bodySemanticJudgment\.statements/.test(wiring)],
  ['error responses are not reconstructed downstream', /errorResponses: result\.contract\.bodySemanticJudgment\.errorResponses/.test(wiring)],
  ['action publication does not call controllerStatements directly', !/controllerStatements\(/.test(wiring)],
  ['upstream index exports the body judgment contract', /ControllerBodySemanticJudgmentAuthorityInterface/.test(upstreamIndex)],
  ['public core index exports the body judgment contract', /ControllerBodySemanticJudgmentAuthorityInterface/.test(publicIndex)],
  ['audit command is registered', typeof packageJson.scripts['audit:phase2133-controller-body-semantic-authority'] === 'string'],
  ['no parallel foundation or relation contract was introduced', !/foundation|semantic\/relations/.test(iface)],
  ['runtime executor remains a pass-through', /semanticJudgment: input\.semanticJudgment/.test(wiring)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: raw typed body evidence now enters the existing authority directly; validation/error derivation is authority-owned, while the evidence projection remains only for statements/dataflow.\n');
process.exitCode = failures === 0 ? 0 : 1;
