const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('src/types/upstream/laravelResourceScannerInterface.ts');
const scanner = read('src/compiler/scanner/wiring/laravelResourceScanner.ts');
const pipeline = read('src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['scanner interface owns canonical binding authority dependency', /interface LaravelResourceScannerInterface[\s\S]*?readonly bindingAuthority: ResourceModelBindingJudgmentAuthority;/.test(contract)],
  ['scan input does not accept per-call semantic authority', /export interface LaravelResourceScanInput[\s\S]*?readonly relationEvidence: readonly ResourceRelationBindingEvidence\[\];/.test(contract) && !/export interface LaravelResourceScanInput[\s\S]*?readonly bindingAuthority:/.test(contract)],
  ['scanner is composed once with canonical authority', /bindingAuthority: resourceModelBindingAuthority/.test(scanner) && /scan: createScan\(resourceModelBindingAuthority\)/.test(scanner)],
  ['scanner delegates batch judgment through the bound interface', /const createScan = \(bindingAuthority: ResourceModelBindingJudgmentAuthority\)/.test(scanner) && /bindingAuthority\.judgeBatch\(/.test(scanner)],
  ['scan judgment preserves exact controller scan with integrated invocation response', /controllerScan: input\.controllerScan/.test(scanner) && /readonly controllerScan: LaravelControllerScanJudgment/.test(contract) && /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(read('src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['resource scanner and judgment contracts advance to version 17', /readonly contractVersion: 17/.test(contract) && /contractVersion: 17/.test(scanner)],
  ['pipeline passes evidence only and no longer injects authority per call', pipeline.includes('laravelResourceScanner.scan({') && pipeline.includes('relationEvidence: [],') && !pipeline.includes('bindingAuthority: resourceModelBindingAuthority')],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
process.exitCode = failed ? 1 : 0;
