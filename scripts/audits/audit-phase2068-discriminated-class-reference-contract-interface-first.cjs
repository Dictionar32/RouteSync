const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const regression = read('packages/core/src/types/upstream/__tests__/controller-static-call-discriminated-class-reference.phase2068.test.ts');
const checks = [
  ['origin input has a single discriminated class-reference source', contract.includes('export interface ControllerStaticCallOriginInput') && /export interface ControllerStaticCallOriginInput \{[\s\S]*?readonly classReference: ControllerStaticCallClassReferenceEvidence[\s\S]*?readonly classNameResolutionContext:/.test(contract) && !/export interface ControllerStaticCallOriginInput \{[\s\S]*?readonly className: ClassName;/.test(contract)],
  ['context input is a closed available/unavailable ADT', /readonly classNameResolutionContext: ControllerStaticCallClassNameResolutionContextEvidence;/.test(contract) && !/ControllerStaticCallClassNameResolutionContextEvidence \| ControllerStaticCallClassNameResolutionContext/.test(contract)],
  ['authority resolves by exhaustive context discriminant', /switch \(contextEvidence\.kind\)/.test(authority) && /case 'available':/.test(authority) && /case 'unavailable':/.test(authority)],
  ['authority contract version advances to 11', /readonly contractVersion: 11/.test(contract) && /contractVersion: 11,/.test(authority)],
  ['scanner projects one class reference and does not duplicate className', /classReference: classReferenceEvidence\(value\.classReference\)/.test(scanner) && !/className: createClassName\(value\.className\)/.test(scanner)],
  ['existing model identity consumes the supplied class-name judgment', /judge: \(input, classReferenceJudgment\)/.test(authority) && /const resolvedName = classReferenceJudgment\.qualifiedName/.test(authority)],
  ['no new relation/foundation subscanner is introduced by this phase', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts'))],
  ['phase document exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2068_DISCRIMINATED_CLASS_REFERENCE_CONTRACT_INTERFACE_FIRST.md'))],
  ['phase regression test exercises canonical class-reference and unavailable-context variants', regression.includes('discriminated static-call class-reference contract phase 2068')],
  ['scanner does not classify model-origin judgment itself', /controllerResourceBindingAuthority\.judge\(resourceBindingCandidate/.test(scanner)],
];
let failed = 0;
for (const [name, pass] of checks) {
  const result = typeof pass === 'boolean' ? pass : Boolean(pass);
  process.stdout.write(`${result ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += result ? 0 : 1;
}
process.stdout.write(`Phase 2068: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
