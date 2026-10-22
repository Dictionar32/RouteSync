const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = process.cwd();
const checks = [];
const check = (name, condition) => {
  checks.push({ name, pass: Boolean(condition) });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}`);
};
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const contractPath = 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts';
const coveragePath = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationCoverage.ts';
const integrityPath = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrity.ts';
const authorityPath = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts';
const sources = [contractPath, coveragePath, integrityPath, authorityPath];
const contract = read(contractPath);
const coverage = read(coveragePath);
const integrity = read(integrityPath);
const authority = read(authorityPath);

check('coverage contract-incomplete ADT retains actual RequestTypeDerivationContract', /kind: 'contract_incomplete'[\s\S]{0,220}contract: RequestTypeDerivationContract/.test(contract));
check('contract-bound coverage retains generic TContract for incomplete coverage', /kind: 'contract_incomplete'[\s\S]{0,100}contract: TContract/.test(contract));
check('coverage operation returns the actual contract on incomplete contract coverage', /kind: 'contract_incomplete',[\s\S]{0,100}contract,[\s\S]{0,100}missingLaws/.test(coverage));
check('coverage law ledger is narrowed with a non-empty type predicate', /values is RequestTypeNonEmptyLedger<T>/.test(coverage));
check('coverage operation does not throw to represent an impossible empty ledger', !coverage.includes('throw new Error'));
check('coverage operation does not manufacture a null contract witness', !coverage.includes('contract: null'));
check('upstream coverage ADT has no null contract witness', !/kind: 'contract_incomplete'[\s\S]{0,160}contract: null/.test(contract));
check('integrity gate always checks coverage contract equivalence', /!equivalent\(capability\.contract, coverageContract\)/.test(integrity));
check('integrity gate does not bypass coverage contract checking for null', !integrity.includes('coverageContract !== null'));
check('authority still handles contract-incomplete coverage as typed authority inconsistency', /coverageEvidence\.kind === 'contract_incomplete'[\s\S]{0,180}contract_law_coverage_incomplete/.test(authority));

for (const relative of sources) {
  const result = ts.transpileModule(read(relative), {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const errors = (result.diagnostics || []).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  check(`syntax transpilation ${relative}`, errors.length === 0);
}

const failed = checks.filter(result => !result.pass);
console.log(`\nRESULT ${checks.length - failed.length}/${checks.length} structural/syntax assertions passed`);
if (failed.length) process.exitCode = 1;
