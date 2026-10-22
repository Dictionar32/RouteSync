const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['resource scan operation is explicitly typed from existing upstream interface', /const createScan\s*=\s*\(bindingAuthority:\s*ResourceModelBindingJudgmentAuthority\):\s*LaravelResourceScannerInterface<ResourceScanEvidence>\['scan'\]/.test(scanner)],
  ['canonical scanner exports the existing interface-typed operation', /export const laravelResourceScanner:\s*LaravelResourceScannerInterface<ResourceScanEvidence>/.test(scanner)],
  ['upstream interface owns the complete Resource evidence inventory input', /readonly resourceEvidence:\s*readonly Evidence\[\]/.test(contract) && /interface LaravelResourceSourceEvidence/.test(contract)],
  ['scanner forwards source-bound relation evidence without semantic augmentation', /const sourceEvidence = input\.resourceEvidence/.test(scanner) && /sourceEvidence\.flatMap\(evidence => evidence\.relations\)/.test(scanner) && /relations:\s*relationEvidence/.test(scanner)],
  ['scanner invokes the existing closed batch judgment authority', /bindingAuthority\.judgeBatch\(/.test(scanner) && /readonly judgeBatch:/.test(read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts'))],
  ['existing authority contains batch judgment implementation', /const judgeBatch\s*=\s*\(/.test(authority) && /judgeBatch,/.test(authority)],
  ['no new duplicate resource scanner contract introduced', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phase2474ResourceScannerInterface.ts'))],
  ['Phase2474 audit script is registered', typeof packageJson.scripts['audit:phase2474-existing-resource-scan-contract-wiring'] === 'string'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
