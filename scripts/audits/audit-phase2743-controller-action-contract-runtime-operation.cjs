'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const scanner = path.join(core, 'compiler/scanner');
const operationFile = path.join(scanner, 'descriptors/request/controllerActionContract.ts');
const wiringFile = path.join(scanner, 'wiring/laravelControllerExecutionDependencies.ts');
const testFile = path.join(scanner, 'descriptors/request/controllerActionContract.phase10.test.ts');
const relative = p => path.relative(root, p);
const read = p => fs.readFileSync(p, 'utf8');
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name); return e.isDirectory() ? walk(p) : [p];
  });
}
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });
const op = read(operationFile), wiring = read(wiringFile), test = read(testFile);
check('controller action contract exports no free functions', !/\bexport\s+(?:async\s+)?function\s+/.test(op), relative(operationFile));
check('implementation functions are internal', ['controllerRequestBindingEvidenceFromMethodImplementation','controllerRequestBindingJudgmentFromMethodImplementation','resolveControllerActionContractImplementation','schemaRequestEvidenceImplementation'].every(n => new RegExp('function\\s+'+n+'\\b').test(op)) && !/export\s+function\s+(controllerRequestBindingEvidenceFromMethod|controllerRequestBindingJudgmentFromMethod|resolveControllerActionContract|schemaRequestEvidence)\b/.test(op), '4 internal implementations');
check('public operation interface has explicit typed signatures', /export interface ControllerActionContractOperationsInterface/.test(op) && ['controllerRequestBindingEvidenceFromMethod','controllerRequestBindingJudgmentFromMethod','resolveControllerActionContract','schemaRequestEvidence'].every(n => op.includes('readonly '+n+':')), '4 typed operation members');
check('public API is interface-typed frozen operation object', /export const controllerActionContractOperations:\s*ControllerActionContractOperationsInterface\s*=\s*Object\.freeze\(/.test(op), 'interface-typed Object.freeze');
check('production wiring imports operation object rather than free functions', /import \{ controllerActionContractOperations, type ControllerActionContract \}/.test(wiring) && !/import \{[^}]*\b(resolveControllerActionContract|controllerRequestBindingEvidenceFromMethod|schemaRequestEvidence)\b/.test(wiring), 'production imports operation object');
check('request evidence production path uses operation object', /controllerActionContractOperations\.controllerRequestBindingEvidenceFromMethod/.test(wiring), 'request evidence -> operation');
check('action contract production path uses operation object', /controllerActionContractOperations\.resolveControllerActionContract/.test(wiring), 'action contract -> operation');
check('schema evidence production path uses operation object', /controllerActionContractOperations\.schemaRequestEvidence/.test(wiring), 'schema evidence -> operation');
check('tests use operation object for all migrated entrypoints', ['controllerRequestBindingJudgmentFromMethod','resolveControllerActionContract','schemaRequestEvidence'].every(n => test.includes('controllerActionContractOperations.'+n+'(')), 'tests migrated');
check('subscanners directory remains erased', !fs.existsSync(path.join(scanner, 'subscanners')), 'no legacy directory');
for (const dir of ['semantic/relations','semantic/foundation']) {
  const p = path.join(core, dir);
  check(dir+' remains empty', fs.existsSync(p) && walk(p).length === 0, fs.existsSync(p) ? `${walk(p).length} files` : 'directory missing');
}
const stale = walk(core).filter(p => /\.(?:ts|tsx|js|mjs|cjs|json)$/.test(p) && read(p).includes('relationFoundation'));
check('no relationFoundation references remain in core source', stale.length === 0, `${stale.length} files`);
const scan = read(path.join(root,'packages/cli/src/commands/scan.ts'));
const sync = read(path.join(root,'packages/cli/src/commands/sync.ts'));
check('CLI scan still enters shared manifest scan and projection composition', /manifestScanOperation\.scan\(/.test(scan) && /routeManifestProjectionCompositionFactory\.create\(/.test(scan), 'CLI scan -> manifest operation -> projection composition');
check('CLI sync still enters shared manifest scan and projection composition', /manifestScanOperation\.scan\(/.test(sync) && /routeManifestProjectionCompositionFactory\.create\(/.test(sync), 'CLI sync -> manifest operation -> projection composition');
const report = { phase: 2743, title: 'Interface-first controller action contract runtime operation', passed: checks.every(x=>x.passed), checksPassed: checks.filter(x=>x.passed).length, checksTotal: checks.length, checks };
const reportPath = path.join(root,'reports/PHASE2743_CONTROLLER_ACTION_CONTRACT_RUNTIME_OPERATION_AUDIT.json');
fs.writeFileSync(reportPath, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (!report.passed) process.exitCode = 1;
