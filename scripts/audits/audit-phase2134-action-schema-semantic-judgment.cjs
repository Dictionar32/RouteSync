const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const extractor = read('packages/core/src/compiler/scanner/subscanners/controller/actionValidationExtractor.ts');
const contract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const knowledge = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const bodyAuthority = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['upstream schema authority contract is explicit', /ControllerActionSchemaSemanticJudgmentAuthorityInterface/.test(iface) && /controller_action_schema_semantic_judgment_authority/.test(iface)],
  ['schema judgment retains exact source identity', /readonly sourceIdentity: TSourceIdentity/.test(iface) && /schema-judgment-retains-the-exact-action-source-identity/.test(iface)],
  ['schema derivation is a discriminated union', /inline_validation_schema/.test(iface) && /form_request_schema/.test(iface) && /form_request_and_inline_validation_schema/.test(iface)],
  ['derivation ADT owns both schema payload and explicit provenance', /readonly derivation: ControllerActionSchemaDerivation/.test(iface) && /readonly schema: RouteSchemaPayload/.test(iface) && /readonly schema: RouteSchemaPayload/.test(iface.split('export interface ControllerActionSchemaSemanticJudgmentAuthorityInterface')[0])],
  ['existing schema merge logic is owned by the upstream authority', /controllerActionSchemaSemanticJudgmentAuthority/.test(authority) && /formRequestFields\(input\.requestEvidence\)/.test(authority) && /createRouteSchemaPayload/.test(authority)],
  ['upstream authority merges FormRequest and inline schema only in the combined outcome', /form_request_and_inline_validation_schema/.test(authority) && /\[\.\.\.fields, \.\.\.inlineSchema\.fields\]/.test(authority)],
  ['upstream authority preserves inline schema messages and attributes', /inlineSchema\.messages/.test(authority) && /inlineSchema\.attributes/.test(authority)],
  ['legacy resolveActionSchema entry point is retired', !/export function resolveActionSchema/.test(extractor) && !/resolveActionSchema\(/.test(contract)],
  ['scanner extractor no longer owns schema merge semantics', !/createRouteSchemaPayload|schemaIsEmpty|formRequestFields/.test(extractor) && /createRouteSchemaPayload|schemaIsEmpty|formRequestFields/.test(authority)],
  ['action contract invokes the schema authority with exact source identity', /controllerActionSchemaSemanticJudgmentAuthority\.judge\(\{[\s\S]*?requestEvidence: schemaRequestEvidence\(request\)[\s\S]*?sourceIdentity: sourceFile/.test(contract)],
  ['action projection retains the completed schema judgment', /readonly schemaSemanticJudgment: ControllerActionSchemaSemanticJudgment<SourceFile>/.test(contract) && /schemaSemanticJudgment,/.test(contract)],
  ['action contract schema is taken from the judgment derivation ADT', /schema: schemaSemanticJudgment\.derivation\.schema/.test(contract)],
  ['action semantic publication consumes the judgment derivation ADT', /schema: result\.contract\.schemaSemanticJudgment\.derivation\.schema/.test(wiring)],
  ['action contract coverage acknowledges schema authority ownership', /schema-derivation-is-owned-by-a-source-correlated-action-schema-semantic-judgment/.test(knowledge) && /schema-derivation-is-owned-by-a-source-correlated-action-schema-semantic-judgment/.test(wiring)],
  ['action judgment contract version advances to 10', /readonly version: 10/.test(knowledge) && /version: 10 as const/.test(wiring)],
  ['schema judgment and implementation are exported from upstream index', /ControllerActionSchemaSemanticJudgmentAuthorityInterface/.test(upstreamIndex) && /controllerActionSchemaSemanticJudgmentAuthority/.test(upstreamIndex)],
  ['schema judgment and implementation are exported from public core index', /ControllerActionSchemaSemanticJudgmentAuthorityInterface/.test(publicIndex) && /controllerActionSchemaSemanticJudgmentAuthority/.test(publicIndex)],
  ['invocation judgment remains exact and attached', /invocationJudgment: input\.invocationJudgment/.test(wiring)],
  ['integrated response remains separate from per-action schema judgment', /judgeIntegratedResponse\(/.test(scanner) && /integratedResponseOwnership: 'controller-wide-integrated-response-remains-owned-by-LaravelControllerResponseSemanticPipelineInterface/.test(wiring)],
  ['body semantic authority remains independently owned', /controllerBodySemanticJudgmentAuthority/.test(bodyAuthority) && /bodySemanticJudgment: bodyJudgment/.test(contract)],
  ['runtime executor remains a judgment pass-through', /semanticJudgment: input\.semanticJudgment/.test(wiring)],
  ['no parallel foundation or relation layer is introduced', !/foundation/.test(iface + authority) && !/types\/upstream\/(?:foundation|relation)/.test(iface + authority)],
  ['phase audit is registered in package scripts', typeof pkg.scripts['audit:phase2134-action-schema-semantic-judgment'] === 'string'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: upstream authority owns schema merge and emits a source-correlated judgment with an explicit derivation ADT; the broader action resolver and body AST projection remain migration debt.\n');
process.exitCode = failures === 0 ? 0 : 1;
