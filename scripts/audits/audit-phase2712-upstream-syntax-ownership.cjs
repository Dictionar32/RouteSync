const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const syntaxInterface = read('packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts');
const syntaxOwner = read('packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts');
const methodParser = read('packages/core/src/compiler/frontend/php/phpMethodParser.ts');
const methodBarrel = read('packages/core/src/compiler/frontend/php/index.ts');
const consumers = [
  ['packages/core/src/compiler/scanner/laravelModelScanner.ts', 'source'],
  ['packages/core/src/compiler/frontend/php/resourceSourceEvidence.ts', 'source'],
  ['packages/core/src/compiler/scanner/laravelFormRequestScanner.ts', 'sourceText'],
  ['packages/core/src/compiler/scanner/operations/FormRequestScanner.ts', 'sourceText'],
];

check('upstream parser contract accepts source text for property parsing', /readonly parseProperties:\s*\(source:\s*string\)/.test(syntaxInterface), 'parseProperties no longer leaks TokenSyntax into its public call contract');
check('upstream parser owns tokenization for property parsing', /parseProperties:\s*\(source:\s*string\)[\s\S]*?parsePropertySyntax\(LaravelSourceLexer\.tokenize\(source\)\)/.test(syntaxOwner), 'tokenization is behind sourceAstSyntaxParser.parseProperties');
check('whole-file parse reuses the same property operation', /properties\s*=\s*sourceAstSyntaxParser\.parseProperties\(evidence\.text\)/.test(syntaxOwner), 'avoids a second independent property-syntax implementation at the call site');
check('upstream syntax parser is an interface-typed const object', /export const sourceAstSyntaxParser:\s*SourceAstSyntaxParserInterface[\s\S]*?Object\.freeze\(\{/.test(syntaxOwner), 'runtime parser is exported as an interface-typed operation object');
check('method parser has a named interface contract', /export interface PhpMethodParserInterface/.test(methodParser), 'parse and parseOrReject operations are explicitly typed');
check('method parser exports a frozen interface-typed object', /export const phpMethodParser:\s*PhpMethodParserInterface\s*=\s*Object\.freeze\(\{/.test(methodParser), 'method parser entrypoints are exposed as an operation object');
check('method parser no longer exports free functions', !/export\s+function\s+parsePhpMethod(?:OrThrow)?\b/.test(methodParser), 'legacy exported function declarations are removed from this parser module');
check('method parser barrel exports object and interface only', /export \{ phpMethodParser \}/.test(methodBarrel) && /export type \{ PhpMethodParserInterface \}/.test(methodBarrel) && !/parsePhpMethodOrThrow/.test(methodBarrel), 'public barrel exposes the operation object, not free function aliases');

for (const [relative, variable] of consumers) {
  const source = read(relative);
  check(`${relative} passes source text to upstream property parser`, new RegExp(`sourceAstSyntaxParser\\.parseProperties\\(${variable}\\)`).test(source) && !/sourceAstSyntaxParser\.parseProperties\(tokens\)/.test(source), 'consumer no longer owns the token input boundary for property parsing');
}

const activeScanner = path.join(root, 'packages/core/src/compiler/scanner');
const scannerFiles = [];
const visit = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !absolute.includes(`${path.sep}__tests__${path.sep}`)) scannerFiles.push(absolute);
  }
};
visit(activeScanner);
let exportedFunctionCount = 0;
for (const file of scannerFiles) {
  const source = fs.readFileSync(file, 'utf8');
  exportedFunctionCount += [...source.matchAll(/\bexport\s+(?:async\s+)?function\s+[A-Za-z_$][\w$]*/g)].length;
}
check('remaining scanner exported functions are explicitly inventoried', Number.isInteger(exportedFunctionCount), `${exportedFunctionCount} export function declarations remain in ${scannerFiles.length} non-test scanner files; this phase does not claim global removal`);

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`);
console.log(`\nPhase 2712 upstream syntax ownership audit: ${checks.filter(item => item.passed).length}/${checks.length} assertions passed.`);
console.log('SCOPE: static source assertions only. The legacy lexer remains used by many runtime scanners; this phase narrows its ownership boundary but does not claim the lexer directory can yet be deleted.');
if (checks.some(item => !item.passed)) process.exitCode = 1;
