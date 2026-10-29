const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing scope authority is traced', read('packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts').includes('const actionNames')],
  ['unsupported expressions currently collapse to empty evidence', read('packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts').includes('default: return Object.freeze([])')],
  ['scope selection currently chooses first matching named argument', read('packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts').includes("named.find(argument => argument.name.value.value === 'only')")],
  ['interface currently returns scope directly', read('packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentInterface.ts').includes('=> ControllerPolicyActionScope')],
  ['route flow currently has no closed blocked outcome', !read('packages/core/src/types/upstream/routeMiddleware.ts').includes("kind: 'route_middleware_flow_blocked'")],
  ['root-cause report exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/PHASE1971_POLICY_SCOPE_CLOSED_JUDGMENT_ROOT_CAUSE_TRACE.md'))],
  ['no forbidden relation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation'))],
  ['no forbidden foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} source-trace checks passed. This audit records the current gap; it does not certify a fix.\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
