const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const bodyResolver = read('packages/core/src/compiler/scanner/subscanners/controller/controllerBodyResolver.ts');
const bodyInterface = read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts');
const bodyAuthority = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const schemaInterface = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const schemaAuthority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const actionContract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['legacy body resolver no longer derives validation entries', !/ScannedRouteValidationRuleEntry|validationEntries:|resolveKnownError/.test(bodyResolver)],
  ['canonical body authority derives validation entries from raw AST evidence', /input\.body\.validations\.map\(validation =>[\s\S]*?ScannedRouteValidationRuleEntry\.create/.test(bodyAuthority)],
  ['per-entry SourceSpan remains attached using exact source identity', /file: input\.sourceIdentity,[\s\S]*?start: numberValue\(validation\.source\.startOffset\)/.test(bodyAuthority)],
  ['body semantic judgment publishes validation provenance', /readonly validationEntries: readonly RouteValidationRuleEntry\[\]/.test(bodyInterface)],
  ['body judgment contract version reflects authority-owned schema lowering', /readonly contractVersion: 5/.test(bodyInterface) && /contractVersion: 5/.test(bodyAuthority)],
  ['schema judgment contract version reflects the evolved provenance result', /readonly contractVersion: 3/.test(schemaInterface) && /contractVersion: 3/.test(schemaAuthority)],
  ['body judgment authority derives canonical schema from source-bound entries', /RouteSemanticFlowValidationRuleSet\.create\(validationEntries, TypeInterner\.create\(\)\)\.fields/.test(bodyAuthority) && /createRouteSchemaPayload/.test(bodyAuthority)],
  ['schema judgment result preserves inline validation provenance', /readonly inlineValidationEntries: readonly RouteValidationRuleEntry\[\]/.test(schemaInterface)],
  ['schema authority input explicitly receives validation entries', /readonly inlineValidationEntries: readonly RouteValidationRuleEntry\[\]/.test(schemaInterface)],
  ['schema authority preserves entries in the completed judgment', /inlineValidationEntries: Object\.freeze\(\[\.\.\.input\.inlineValidationEntries\]\)/.test(schemaAuthority)],
  ['schema merge authority remains the sole owner of FormRequest/inline merge', /formRequestDerivation\(input\.requestEvidence\.source\.fields, input\.inlineSchema\)/.test(schemaAuthority) && /createRouteSchemaPayload/.test(schemaAuthority)],
  ['action contract passes completed body judgment validation evidence to schema authority', /inlineValidationEntries: bodyJudgment\.validationEntries/.test(actionContract)],
  ['action schema projection still consumes the completed judgment result', /schema: schemaSemanticJudgment\.derivation\.schema/.test(actionContract)],
  ['source identity is preserved in body judgment', /sourceIdentity: input\.sourceIdentity/.test(bodyAuthority)],
  ['source identity is preserved in schema judgment', /sourceIdentity: input\.sourceIdentity/.test(schemaAuthority)],
  ['invocation judgment forwarding is unchanged', /invocationJudgment: input\.invocationJudgment/.test(wiring)],
  ['integrated response remains controller-wide', /judgeIntegratedResponse\(/.test(scanner) && /LaravelControllerResponseSemanticPipelineInterface/.test(wiring)],
  ['runtime executor remains pass-through', /semanticJudgment: input\.semanticJudgment/.test(wiring)],
  ['no foundation layer or parallel validation authority is introduced', !/foundation/.test(bodyResolver + bodyInterface + bodyAuthority + actionContract) && !/InlineValidationAuthority/.test(bodyResolver + actionContract)],
  ['package script registers Phase 2136 audit', typeof pkg.scripts['audit:phase2136-inline-validation-semantic-judgment-closure'] === 'string'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: raw inline-validation AST evidence is lowered by the body authority and its per-entry provenance survives action-schema judgment closure.\n');
process.exitCode = failures === 0 ? 0 : 1;
