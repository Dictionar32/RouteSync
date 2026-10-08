const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'packages/core/src/compiler/diagnostics/index.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['Diagnostic interface is type-only', /export type \{[\s\S]*?\bDiagnostic\b[\s\S]*?\} from '\.\/Diagnostic';/.test(source)],
  ['Diagnostic trace and suggestion contracts are type-only', /export type \{[\s\S]*?\bDiagnosticTraceNode\b[\s\S]*?\bDiagnosticSuggestions\b[\s\S]*?\} from '\.\/Diagnostic';/.test(source)],
  ['DiagnosticCategory runtime value remains exported', /export \{[\s\S]*?\bDiagnosticCategory\b[\s\S]*?\} from '\.\/Diagnostic';/.test(source)],
  ['DiagnosticLocation runtime constructor remains exported', /export \{[\s\S]*?\bDiagnosticLocation\b[\s\S]*?\} from '\.\/Diagnostic';/.test(source)],
  ['DiagnosticBag runtime value remains exported', /export \{ DiagnosticBag \} from '\.\/DiagnosticBag';/.test(source)],
  ['CompilerValidationError interface is type-only', /export type \{ CompilerValidationError,/.test(source)],
  ['Runtime Diagnostic export block excludes type-only trace names', (() => { const block = source.match(/export \{([\s\S]*?)\} from '\.\/Diagnostic';/); return Boolean(block) && !/\b(?:Diagnostic|DiagnosticTraceNode|DiagnosticTrace|DiagnosticSuggestion|DiagnosticSuggestions|DiagnosticSeverity|DiagnosticFix|TextEdit)\b/.test(block[1]); })()],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`RESULT ${checks.length - failed}/${checks.length} passed; ${failed} failed`);
if (failed) process.exitCode = 1;
