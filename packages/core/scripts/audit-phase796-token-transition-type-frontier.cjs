const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/lexer/tokenize/compoundScanners.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = {
  directTokenTypeClosed: /const direct: TokenDescriptor\['type'\] = relationOptionFold\(/.test(source),
  fallbackUsesClosedTokenType: /const fallback = action\(1, direct\);/.test(source),
  noFreeDirectTokenType: !/const direct = relationOptionFold\(/.test(source),
  simpleOperatorCatalogTyped: /readonly \(readonly \[string, TokenDescriptor\['type'\]\]\)\[\]/.test(source),
};
const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 796, checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
