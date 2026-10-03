const fs = require('fs');
const path = require('path');
const roots = [
  'packages/core/src/semantic/kernel/syntax/cursorDecisionRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/tokenCursorAuthority.ts',
  'packages/core/src/semantic/kernel/syntax/syntaxEvidenceRelations.ts',
  'packages/core/src/compiler/constraints/solver/declarativeConstraintRelations.ts',
].map((p) => path.resolve(process.cwd(), p));
const forbidden = [/\bif\b/, /\bwhile\b/, /\bfor\b/, /\bswitch\b/, /\.map\s*\(/, /\.filter\s*\(/, /\.reduce\s*\(/, /\.flatMap\s*\(/, /\bundefined\b/, /\?\?/, /!==|===/, /\bas\s/];
const violations = [];
for (const file of roots) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    for (const rule of forbidden) if (rule.test(line)) violations.push(`${file}:${index + 1}:${line.trim()}`);
  }
}
console.log(`Phase 343 semantic authority violations: ${violations.length}`);
violations.forEach((v) => console.log(v));
process.exitCode = violations.length ? 1 : 0;
