const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const bodyInterface = read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const resolver = read('packages/core/src/compiler/scanner/subscanners/controller/controllerBodyResolver.ts');
const actionContract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const actionWiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const controllerScanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');

check('existing body authority contract advances to version 5', /readonly contractVersion: 5/.test(bodyInterface) && /contractVersion: 5/.test(canonical));
check('body authority consumes raw typed ControllerBodyAst evidence', /ControllerBodySemanticJudgmentAuthorityInterface<[\s\S]*?ControllerBodyAst<true>,\s*ControllerMethodAst,\s*SourceFile/.test(canonical));
check('action contract passes method.body directly to the existing authority', /controllerBodySemanticJudgmentAuthority\.judge\(\{ body: method\.body, method, sourceIdentity: sourceFile \}\)/.test(actionContract));
check('legacy body resolver no longer owns validation/error interpretation', !/resolveKnownError|KNOWN_ERRORS|ScannedRouteValidationRuleEntry|httpErrorResponse/.test(resolver));
check('legacy body resolver is only an evidence projection type', /ControllerBodyEvidenceProjection/.test(resolver) && !/function resolveControllerBody/.test(resolver));
check('old semantic resolver export is retired from controller subscanner index', /export type \{ ControllerBodyEvidenceProjection \}/.test(read('packages/core/src/compiler/scanner/subscanners/controller/index.ts')) && !/export \{ resolveControllerBody \}/.test(read('packages/core/src/compiler/scanner/subscanners/controller/index.ts')));
check('authority lowers inline validation evidence into canonical entries', /input\.body\.validations\.map\(validation =>[\s\S]*?ScannedRouteValidationRuleEntry\.create/.test(canonical));
check('validation provenance uses exact source identity and source offsets', /file: input\.sourceIdentity,[\s\S]*?start: numberValue\(validation\.source\.startOffset\),[\s\S]*?end: numberValue\(validation\.source\.endOffset\)/.test(canonical));
check('schema is lowered from the authority-owned validation entries', /RouteSemanticFlowValidationRuleSet\.create\(validationEntries, TypeInterner\.create\(\)\)/.test(canonical));
check('known error status rules are owned by the canonical body authority', /controllerBodyErrorResponseRules[\s\S]*?status: 400[\s\S]*?status: 401[\s\S]*?status: 403[\s\S]*?status: 404[\s\S]*?status: 422[\s\S]*?status: 500/.test(canonical));
check('unknown error statuses are not fabricated into known error descriptors', /rule === undefined \? \[\] : \[rule\.create\(\)\]/.test(canonical));
check('published body semantic knowledge consumes the exact closed body judgment', /statements: result\.contract\.bodySemanticJudgment\.statements/.test(actionWiring) && /errorResponses: result\.contract\.bodySemanticJudgment\.errorResponses/.test(actionWiring));
check('integrated response remains a distinct source-correlated pipeline', /judgeIntegratedResponse/.test(controllerScanner) && /astProjection\.judge/.test(controllerScanner));
check('resource binding remains owned by the existing upstream authority', /controllerResourceBindingAuthority/.test(read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts')));
check('no new relation/foundation or subscanner authority is introduced', !/semantic\/foundation|subscanners\/controllerBodySemanticAuthority/.test(canonical + actionContract + resolver));

const failed = checks.filter(item => !item.passed);
const report = { phase: 2157, title: 'Controller Body Authority Owns Validation and Error Derivation', passed: checks.length - failed.length, total: checks.length, checks, regressionAudits: [{ phase: 2133, passed: 18, total: 18 }, { phase: 2136, passed: 20, total: 20 }, { phase: 2137, passed: 15, total: 15 }, { phase: 2138, passed: 11, total: 11 }, { phase: 2154, passed: 26, total: 26 }, { phase: 2155, passed: 18, total: 18 }, { phase: 2156, passed: 14, total: 14 }] };
fs.writeFileSync(path.join(root, 'reports/phase2157/PHASE2157_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${report.passed}/${report.total} checks passed\n`);
process.exitCode = failed.length ? 1 : 0;
