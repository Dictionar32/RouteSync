const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const contract = fs.readFileSync(interfacePath, 'utf8');
const checks = [
  ['runtime imports canonical assignment-target contract algebra', /import\s*\{\s*scannerAssignmentTargetContractAlgebra\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/types\/upstream\/scannerAssignmentTargetAlgebra['"]/.test(runtime)],
  ['runtime invokes canonical contract algebra', /scannerAssignmentTargetContractAlgebra\.resolve</.test(runtime)],
  ['runtime supplies top-level occurrence evidence interface', /locateTopLevel:\s*\(source,\s*target\)\s*=>\s*scannerTokenStructureInterface\.locateTopLevel/.test(runtime)],
  ['runtime supplies leading delimiter evidence interface', /matchLeadingDelimiter:\s*source\s*=>\s*scannerTokenStructureInterface\.matchLeadingDelimiter/.test(runtime)],
  ['runtime does not invoke legacy assignment-target algebra', !/scannerAssignmentTargetAlgebra\.resolve/.test(runtime)],
  ['runtime no longer supplies cursor slice callback for assignment target', !/slice:\s*relationSlice/.test(runtime.slice(runtime.indexOf('function classifyAssignmentTarget'), runtime.indexOf('function classifyStaticPropertyTarget')))],
  ['runtime no longer supplies index-returning operator callback for assignment target', !/findTopLevelOperator:/.test(runtime.slice(runtime.indexOf('function classifyAssignmentTarget'), runtime.indexOf('function classifyStaticPropertyTarget')))],
  ['runtime handles malformed evidence by location', /case 'malformed':\s*\{[\s\S]*?resolution\.location\.kind/.test(runtime)],
  ['runtime handles closed contract violation judgment', /case 'contract_violation':\s*throw new Error\(`Assignment target contract violation:/.test(runtime)],
  ['algebra canonical entry implements interface', /scannerAssignmentTargetContractAlgebra:\s*ScannerAssignmentTargetInterface/.test(algebra)],
  ['public contract defines closed judgment variants', /kind:\s*'resolved'[\s\S]*kind:\s*'unresolved'[\s\S]*kind:\s*'malformed'[\s\S]*kind:\s*'contract_violation'/.test(contract)],
  ['public malformed judgment uses evidence location rather than numeric index', /kind:\s*'malformed';\s*readonly location:\s*TokenEvidenceLocation<Token>/.test(contract)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1448 assignment-target interface wiring: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
