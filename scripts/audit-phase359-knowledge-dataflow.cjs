const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const canonical = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations.ts');
const legacy = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowModel.ts');
const source = fs.readFileSync(canonical, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const rules = {
  if: /\bif\s*\(/, for: /\bfor\s*\(/, while: /\bwhile\s*\(/, switch: /\bswitch\s*\(/,
  map: /\.map\s*\(/, filter: /\.filter\s*\(/, reduce: /\.reduce\s*\(/, flatMap: /\.flatMap\s*\(/,
  undefined: /\bundefined\b/, nullHost: /(?<!['"])\bnull\b(?!['"])/, nullish: /\?\?/, strictEquality: /===/, assertion: /\bas\b/
};
const violations = Object.entries(rules).filter(([, re]) => re.test(source)).map(([name]) => name);
const result = { phase: 359, canonicalViolations: violations, legacyBytes: fs.statSync(legacy).size };
console.log(JSON.stringify(result, null, 2));
if (violations.length || result.legacyBytes !== 0) process.exit(1);
