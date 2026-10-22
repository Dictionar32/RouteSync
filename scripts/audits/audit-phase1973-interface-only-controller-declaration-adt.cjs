const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const source = fs.readFileSync(contractPath, 'utf8');
const checks = [
  ['complete selection requires root_reached', /kind: 'controller_declaration_selection_complete'[\s\S]*?kind: 'root_reached'/.test(source)],
  ['blocked selection excludes root_reached', /kind: 'controller_declaration_selection_blocked'[\s\S]*?Exclude<ControllerDeclarationAncestryTermination, \{ readonly kind: 'root_reached' \}>/.test(source)],
  ['partial ancestry reasons remain typed', /parent_outside_inventory/.test(source) && /inheritance_cycle/.test(source)],
  ['no relation/foundation subscanner path added by this phase', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/semantic/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/semantic/relations'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed).length;
process.stdout.write(`\n${checks.length - failed}/${checks.length} interface-only structural checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
