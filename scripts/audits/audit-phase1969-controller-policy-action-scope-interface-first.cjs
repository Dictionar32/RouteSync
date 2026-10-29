const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['upstream interface exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentInterface.ts'))],
  ['authority is closed', read('packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts').includes("closed: true")],
  ['authority exposes typed analyze', read('packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts').includes('analyze: (arguments_: ExpressionArguments): ControllerPolicyActionScope')],
  ['attribute policy scope delegates upstream', read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts').includes('return controllerPolicyActionScopeJudgmentAuthority.analyze(attribute.arguments);')],
  ['HasMiddleware scope delegates upstream', read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts').includes('return controllerPolicyActionScopeJudgmentAuthority.analyze(arguments_);')],
  ['public exports include interface', read('packages/core/src/index.ts').includes('ControllerPolicyActionScopeJudgmentInterface')],
  ['public exports include authority', read('packages/core/src/index.ts').includes('controllerPolicyActionScopeJudgmentAuthority')],
  ['focused regression test exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.phase1969.test.ts'))],
  ['no relation subscanner created', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation'))],
  ['no foundation subscanner created', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}
`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`${checks.length - failed.length}/${checks.length} structural checks passed
`);
process.exitCode = failed.length === 0 ? 0 : 1;
