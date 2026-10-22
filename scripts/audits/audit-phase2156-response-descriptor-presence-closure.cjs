const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const contract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const responseDescriptors = read('packages/core/src/types/domain/responseDescriptors.ts');
const actionAuthority = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const responsePipeline = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const phase2155 = read('packages/core/src/types/upstream/docs/PHASE2155-LEGACY-REQUEST-DERIVATION-RETIREMENT-INTERFACE-FIRST.md');

check('response presence comes from descriptor semantic contract', /responsePresence: ControllerResponse = response\.semanticPresence/.test(contract));
check('resource, model, and inline descriptors publish present judgments', (responseDescriptors.match(/semanticPresence: Object\.freeze\(\{ kind: 'response_present'/g) ?? []).length === 3);
check('only void descriptor publishes absent judgment', /semanticPresence: Object\.freeze\(\{ kind: 'response_absent' \}\)/.test(responseDescriptors));
check('old resource-only presence classifier is retired', !/response\.kind === 'resource'/.test(contract));
check('one response-presence judgment feeds canonical return semantics', /controllerReturnSemanticFromMethod\(method, sourceFile\.value\.value, responsePresence\)/.test(contract));
check('one response-presence judgment feeds controller dataflow', /response: responsePresence,/.test(contract));
check('one response-presence judgment is published in action contract', /semanticResponse: responsePresence,/.test(contract));
check('response descriptor presence contract is exported', /type ResponseDescriptorPresenceContract/.test(read('packages/core/src/types/domain/responses.ts')) && /type ResponseDescriptorPresenceContract/.test(read('packages/core/src/types/domain/index.ts')));
check('action semantic authority remains existing production composition', /legacyLaravelControllerExecutionDependencies/.test(actionAuthority) && /actionJudgment: Object\.freeze/.test(actionAuthority));
check('integrated response pipeline remains a distinct controller-wide judgment', /judgeIntegratedResponse/.test(responsePipeline) && /astProjection\.judge/.test(responsePipeline));
check('phase 2155 request-authority retirement remains documented', /resolveRequest/.test(phase2155) && /authority/.test(phase2155));
check('no relation/foundation subscanner or duplicate response authority introduced', !/semantic\/foundation|subscanners\/responseSemanticAuthority/.test(contract));

const failed = checks.filter(item => !item.passed);
const report = { phase: 2156, title: 'Response Descriptor Presence Closure — Descriptor-Owned Judgment, Interface First', passed: checks.length - failed.length, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'reports/phase2156/PHASE2156_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${report.passed}/${report.total} checks passed\n`);
process.exitCode = failed.length ? 1 : 0;
