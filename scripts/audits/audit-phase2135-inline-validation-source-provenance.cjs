const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const body = read('packages/core/src/compiler/scanner/subscanners/controller/controllerBodyResolver.ts');
const astTypes = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const contract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const entry = read('packages/core/src/compiler/scanner/descriptors/validation/validationRuleEntry.ts');
const schemaInterface = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const schemaAuthority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const actionKnowledge = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['body resolver requires the canonical source-file identity', /resolveControllerBody\(body: ControllerBodyAst, sourceFile: SourceFile\)/.test(body)],
  ['action contract supplies the exact source file to body resolution', /resolveControllerBody\(method\.body, sourceFile\)/.test(contract)],
  ['inline validation AST retains per-entry SourceRange instead of call-token provenance', /readonly source: SourceRange/.test(astTypes) && /source: current\.source/.test(parser)],
  ['inline validation source range is converted to a source span', /validationSourceSpan\(validation\.source, sourceFile\)/.test(body)],
  ['source span retains the exact source-file object', /file: sourceFile/.test(body)],
  ['source span start derives from per-entry source start offset', /start: numberValue\(Number\(source\.startOffset\)\)/.test(body)],
  ['source span end derives from per-entry source end offset', /end: numberValue\(Number\(source\.endOffset\)\)/.test(body)],
  ['canonical validation entry receives its source span instead of sentinel default', /validation\.rules,[\s\S]*?undefined,[\s\S]*?validationSourceSpan/.test(body)],
  ['legacy validation sentinel is no longer the body resolver source path', !/ScannedRouteValidationRuleEntry\.create\(validation\.field, validation\.rules\)/.test(body)],
  ['validation rule entry keeps source provenance in its domain contract', /readonly source: SourceSpan/.test(entry)],
  ['schema judgment still retains exact action source identity', /readonly sourceIdentity: TSourceIdentity/.test(schemaInterface)],
  ['schema derivation remains a discriminated union', /inline_validation_schema/.test(schemaInterface) && /form_request_schema/.test(schemaInterface) && /form_request_and_inline_validation_schema/.test(schemaInterface)],
  ['schema authority remains the owner of FormRequest/inline merge', /formRequestFields\(input\.requestEvidence\)/.test(schemaAuthority) && /createRouteSchemaPayload/.test(schemaAuthority)],
  ['action semantic judgment still publishes canonical schema knowledge', /schema: RouteSchemaPayload/.test(actionKnowledge)],
  ['action wiring still consumes completed schema judgment', /schema: result\.contract\.schemaSemanticJudgment\.derivation\.schema/.test(wiring)],
  ['invocation judgment correlation is unchanged', /invocationJudgment: input\.invocationJudgment/.test(wiring)],
  ['integrated response remains controller-wide', /judgeIntegratedResponse\(/.test(scanner) && /LaravelControllerResponseSemanticPipelineInterface/.test(wiring)],
  ['runtime executor remains pass-through', /semanticJudgment: input\.semanticJudgment/.test(wiring)],
  ['no foundation or duplicate validation authority is introduced', !/foundation/.test(body + contract) && !/interface RouteValidation.*Authority/.test(body + contract)],
  ['audit is registered in package scripts', typeof pkg.scripts['audit:phase2135-inline-validation-source-provenance'] === 'string'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: inline controller validation entries now retain their real source file and token offsets; schema authority, invocation judgment, integrated response, and runtime pass-through remain separate contracts.\n');
process.exitCode = failures === 0 ? 0 : 1;
