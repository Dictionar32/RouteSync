const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const parserPath = 'packages/core/src/compiler/frontend/php/sourceAstSyntaxParser.ts';
const parser = read(parserPath);
const contract = read('packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts');
const frontendBarrel = read('packages/core/src/compiler/frontend/php/index.ts');
const semanticProducer = read('packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts');
const cliFactory = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliScanOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');

check('syntax parser owned by frontend/php', exists(parserPath) && !exists('packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts'), 'implementation exists only at compiler/frontend/php/sourceAstSyntaxParser.ts');
check('syntax parser has no scanner dependency', !/from\s+['"][^'"]*scanner/.test(parser), 'frontend parser imports phpSourceTokenizer and phpMethodParser directly');
check('tokenization owned by frontend PHP', parser.includes('phpSourceTokenizer.tokenize(evidence.text)') && !parser.includes('LaravelSourceLexer'), 'the parser no longer calls the scanner facade');
check('runtime operation is interface-typed object', /export const sourceAstSyntaxParser:\s*SourceAstSyntaxParserInterface</.test(parser) && /Object\.freeze\(\{/.test(parser), 'export const sourceAstSyntaxParser: SourceAstSyntaxParserInterface = Object.freeze({...})');
check('AST parse results have discriminants', contract.includes("readonly kind: 'source_ast_parsed_file'") && contract.includes("readonly kind: 'source_ast_syntax_parse'"), 'parsed file and parse contract use explicit kind tags');
check('AST parse results remain closed', contract.includes('readonly closed: true'), 'parse contracts state closed: true');
check('AST ADT regression test exists', exists('packages/core/src/compiler/frontend/php/sourceAstSyntaxParser.adt.phase2715.test.ts'), 'tests tagged parse/file variants and property syntax through the runtime object');
check('frontend barrel exports parser and contract', frontendBarrel.includes("export { sourceAstSyntaxParser } from './sourceAstSyntaxParser'") && frontendBarrel.includes('SourceAstSyntaxParseContract'), 'explicit named exports, no wildcard export added');
check('semantic producer uses frontend owner', semanticProducer.includes("from \"../frontend/php/sourceAstSyntaxParser\""), 'semantic production consumes syntax parser without owning its implementation');
check('CLI composition remains typed and fail-closed', cliFactory.includes('RouteSyncCliUpstreamCompositionFactoryInterface') && cliFactory.includes("case 'rejected':") && cliFactory.includes('const exhaustive: never'), 'composition assembly uses discriminated union and exhaustive rejection');
check('CLI manifest scan operation remains typed', cliScanOperation.includes('RouteSyncCliManifestScanOperationFactoryInterface') && cliScanOperation.includes('routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface'), 'CLI operation is exported as interface-typed object');
check('manifest authority consumes builder preparation', cliComposition.includes('manifestBuilderOperationPreparation'), 'composition binds existing manifest builder preparation');

const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const scannerFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) scannerFiles.push(full);
  }
};
walk(scannerRoot);
let exportedFunctions = 0;
let exportedTypedArrows = 0;
for (const file of scannerFiles) {
  const source = fs.readFileSync(file, 'utf8');
  exportedFunctions += (source.match(/^\s*export\s+function\s+/gm) || []).length;
  exportedTypedArrows += (source.match(/^\s*export\s+const\s+[\w$]+\s*=\s*\(/gm) || []).length;
}
const scannerDirectories = fs.readdirSync(scannerRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
check('scanner migration status is reported, not hidden', scannerDirectories.includes('wiring') && scannerDirectories.some((name) => name !== 'wiring'), `remaining directories: ${scannerDirectories.join(', ')}`);

const result = {
  phase: 2715,
  title: 'Fully Typed AST ADT Runtime Scanner Operations',
  checksPassed: checks.filter((item) => item.pass).length,
  checksTotal: checks.length,
  checks,
  scannerInventory: {
    typescriptFiles: scannerFiles.length,
    exportedFunctionDeclarations: exportedFunctions,
    exportedConstArrowDeclarations: exportedTypedArrows,
    topLevelDirectories: scannerDirectories,
  },
  validationScope: 'Static source audit only; TypeScript typecheck, unit tests, build, and CLI end-to-end were not run by this audit.',
};
console.log(JSON.stringify(result, null, 2));
if (result.checksPassed !== result.checksTotal) process.exitCode = 1;
