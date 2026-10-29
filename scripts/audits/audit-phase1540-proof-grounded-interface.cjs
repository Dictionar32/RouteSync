const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const admissionPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowAdmission.ts');
const bindingPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/semanticDataflowRuntimeBinding.ts');
const contract = fs.readFileSync(interfacePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const admission = fs.readFileSync(admissionPath, 'utf8');
const binding = fs.readFileSync(bindingPath, 'utf8');
const checks = [
  ['admission implementation rejects duplicate closure facts', admission.includes("boundaryReject('closure_fact_duplicate')") && admission.includes('new Set(closureKeys).size !== closureKeys.length')],
  ['admission implementation rejects duplicate rule witnesses', admission.includes("boundaryReject('derivation_witness_duplicate')") && admission.includes('new Set(derivationWitnesses).size !== derivationWitnesses.length')],
  ['admission implementation checks proof grounding from premises', admission.includes('const groundedFacts = new Set<string>()') && admission.includes("boundaryReject('derivation_not_grounded')")],
  ['admission checks judgment facts against derivation conclusions', admission.includes('canonicalInput') && admission.includes('boundaryContainsFact(judgment.facts, derivation.conclusion)')],
  ['interface does not invoke semantic authority', !contract.includes('createSemanticDataflowJudgment(') && !contract.includes('semanticDataflowAuthority.')],
  ['scanner analyzer receives runtime interface before compatibility projection', scanner.includes('executor: SemanticDataflowRuntimeExecutorInterface') && scanner.indexOf('executor.execute(request)') >= 0 && scanner.indexOf('executor.execute(request)') < scanner.indexOf('toLegacyPath(path, model, index)') && binding.includes('createSemanticDataFlowAnalyzer(semanticDataflowRuntimeExecutor)')],
  ['authority implementation remains separate from this phase', authority.includes('createSemanticDataflowJudgment')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
