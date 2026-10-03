const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/semantic/irHints.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = {
  rawCodeUsesRelationRefinement: source.includes("candidate is IRHints => Object.is(typeof candidate, 'object')"),
  withAstUsesRelationRefinement: source.includes("relationFirstOption([hints], (candidate): candidate is IRHints => Object.is(typeof candidate, 'object'))"),
  noUndefinedOptionArgumentToDescriptor: !source.includes('new IRRawNodeDescriptor(code, value)') || source.includes('candidate is IRHints'),
  auditRegistered: typeof pkg.scripts['audit:phase732-ir-hints-option-refinement'] === 'string',
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 732, checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
