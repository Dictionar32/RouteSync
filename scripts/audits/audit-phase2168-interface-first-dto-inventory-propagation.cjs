const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const invocationExecutor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['existing DTO scanner is reused', sourcePipeline.includes('scanDtoAsts(sourceProject)')],
  ['DTO scan occurs before controller scan', sourcePipeline.indexOf('const dtos = await scanDtoAsts(sourceProject)') < sourcePipeline.indexOf('await laravelControllerScanner.scan({')],
  ['controller input owns typed DTO inventory', /readonly dtoInventory: readonly DtoAst\[\]/.test(scannerInterface)],
  ['source pipeline passes exact DTO inventory', /dtoInventory:\s*dtos/.test(sourcePipeline)],
  ['controller scanner forwards DTO inventory to integrated response', /dtoInventory:\s*input\.dtoInventory/.test(scanner)],
  ['integrated response input carries DTO inventory', responseInterface.includes('export interface LaravelControllerResponseIntegratedJudgmentInput') && responseInterface.slice(responseInterface.indexOf('export interface LaravelControllerResponseIntegratedJudgmentInput')).includes('readonly dtoInventory: readonly DtoAst[]')],
  ['evidence producer input carries DTO inventory', responseInterface.slice(responseInterface.indexOf('export interface LaravelControllerResponseEvidenceProductionInput')).includes('readonly dtoInventory: readonly DtoAst[]')],
  ['produced inventory retains DTO inventory', responseInterface.slice(responseInterface.indexOf('export type LaravelControllerResponseEvidenceProductionInventory')).includes('readonly dtoInventory: readonly DtoAst[]')],
  ['binding receipt retains DTO inventory as separate context', responseInterface.slice(responseInterface.indexOf('export type LaravelControllerResponseEvidenceSourceBindingJudgment')).includes('readonly dtoInventory: readonly DtoAst[]')],
  ['response pipeline forwards inventory into producer', responsePipeline.includes('dtoInventory: input.dtoInventory')],
  ['missing semantic evidence remains explicit', responseInterface.includes("readonly missingEvidence: readonly ['resolved_response_attribute_descriptor', 'response_dto_declaration']")],
  ['scanner implementation and interface versions agree', scannerInterface.includes('readonly contractVersion: 33;') && scanner.includes('readonly contractVersion = 33 as const;')],
  ['invocation runtime executor remains an authority delegate', invocationExecutor.includes('execute: (input: InvocationSemanticInput): InvocationSemanticJudgment => authority.analyze(input)')],
  ['response executor remains an authority delegate', responseInterface.includes("readonly execute: Authority['judge'];")],
  ['response judgment contract version matches implementation', responseInterface.includes('readonly contractVersion: 9;') && responsePipeline.includes('contractVersion: 9,')],
  ['no new response subscanner or authority introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/responseDtoInventoryScanner.ts')) && !responseInterface.includes('LaravelControllerResponseDtoInventoryAuthorityInterface')],
];
let failed = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!pass);
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
