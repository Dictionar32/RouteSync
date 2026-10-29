const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/laravelModelScanner.ts');
const depsPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const modelDir = path.join(root, 'packages/core/src/compiler/scanner/operations/model');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const deps = fs.readFileSync(depsPath, 'utf8');
const helperFiles = fs.readdirSync(modelDir).filter(name => name.endsWith('.ts')).map(name => path.join(modelDir, name));
const relationFiles = helperFiles.filter(file => /semantic\/(relations|foundation)/.test(fs.readFileSync(file, 'utf8')));
const foundationFiles = helperFiles.filter(file => /semantic\/foundation/.test(fs.readFileSync(file, 'utf8')));
const checks = [
  ['canonical model operation uses the existing upstream interface', /export const laravelModelScanner:\s*LaravelModelScannerInterface\s*=\s*Object\.freeze/.test(scanner)],
  ['model bundle helper is private to the interface-backed operation', /async function scanModelBundle\(/.test(scanner) && !/export\s+async function scanModelBundle/.test(scanner)],
  ['legacy scanModelAsts runtime export is removed', !/scanModelAsts/.test(scanner)],
  ['scanner module no longer re-exports a subscanner column helper', !/resolveModelColumns|operations\/model"/.test(scanner)],
  ['scanner exposes no uncontracted exported function declarations', !/export\s+(?:async\s+)?function\s+/.test(scanner)],
  ['pipeline uses the typed scanner operation directly', /modelScanner:\s*laravelModelScanner/.test(deps)],
  ['model property syntax is owned by the existing upstream syntax-parser contract without direct relation/foundation imports', !fs.existsSync(path.join(modelDir, 'modelPropertyAstParser.ts')) && /parseProperties\(tokens: readonly TokenSyntax\[\]\)/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts'), 'utf8')) && /parseProperties\(tokens: readonly TokenDescriptor\[\]\)/.test(fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts'), 'utf8')) && !/semantic\/(relations|foundation)/.test(fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts'), 'utf8'))],
  ['model helper directory has no direct relation/foundation imports', relationFiles.length === 0 && foundationFiles.length === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`OPEN architecture debt: ${relationFiles.length} model helper files import semantic/relations; ${foundationFiles.length} import semantic/foundation directly.`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`RESULT ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
