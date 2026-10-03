const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts');
const legacy = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/tokenCursor.ts');
const source = fs.readFileSync(target, 'utf8');
const patterns = [
  /\bif\b/, /\bfor\b/, /\bwhile\b/, /\bswitch\b/, /\.map\b/, /\.filter\b/, /\.reduce\b/, /\.flatMap\b/,
  /\bundefined\b/, /\?\?/, /===/, /\bas\b/, /\bnull\b/
];
const violations = patterns.filter(pattern => pattern.test(source)).map(String);
const result = { phase: 357, navigatorViolations: violations, legacyEmpty: fs.statSync(legacy).size === 0 };
console.log(JSON.stringify(result, null, 2));
if (violations.length || !result.legacyEmpty) process.exit(1);
