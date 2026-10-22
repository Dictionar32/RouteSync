const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const contract = read('packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts');
const parser = read('packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts');
const consumers = [
  read('packages/core/src/compiler/scanner/laravelModelScanner.ts'),
  read('packages/core/src/compiler/scanner/lexer/resourceSourceEvidence.ts'),
  read('packages/core/src/compiler/scanner/subscanners/FormRequestScanner.ts'),
];
const audit1409 = read('scripts/audits/audit-phase1409-upstream-syntax-reasoning-dataflow-boundary.cjs');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['existing SourceAstSyntaxParserInterface owns a typed property-syntax operation', /parseProperties\(tokens: readonly TokenSyntax\[\]\): readonly PropertySyntax\[\]\;/.test(contract)],
  ['existing syntax parser exports the interface-typed operation', /export const sourceAstSyntaxParser: SourceAstSyntaxParserInterface<PhpMethodAst, PhpClassPropertyAst, TokenDescriptor>/.test(parser) && /parseProperties\(tokens: readonly TokenDescriptor\[\]\)/.test(parser)],
  ['property parser implementation is inside syntax-parser ownership, not moved into lexer', /const parsePropertySyntax =/.test(parser) && !exists('packages/core/src/compiler/scanner/lexer/modelPropertyAstParser.ts')],
  ['legacy model subscanner property parser is deleted', !exists('packages/core/src/compiler/scanner/subscanners/model/modelPropertyAstParser.ts')],
  ['Laravel model scanner calls the existing contract instead of a free parser', /sourceAstSyntaxParser\.parseProperties\(tokens\)/.test(consumers[0]) && !/modelPropertyAstParser|parseModelPropertyAsts/.test(consumers[0])],
  ['resource source evidence calls the existing contract instead of a free parser', /sourceAstSyntaxParser\.parseProperties\(tokens\)/.test(consumers[1]) && !/modelPropertyAstParser|parseModelPropertyAsts/.test(consumers[1])],
  ['FormRequest scanner calls the existing contract instead of a free parser', /sourceAstSyntaxParser\.parseProperties\(tokens\)/.test(consumers[2]) && !/modelPropertyAstParser|parseModelPropertyAsts/.test(consumers[2])],
  ['syntax parser no longer imports the retired subscanner or relation/foundation helpers directly', !/subscanners\/model\/modelPropertyAstParser/.test(parser) && !/semantic\/(relations|foundation)/.test(parser)],
  ['file-level syntax parsing preserves model-only property collection', /if \(sameText\(evidence\.sourceKind, 'model'\)\) properties = parsePropertySyntax\(tokens\)/.test(parser)],
  ['existing phase 1409 audit follows the syntax-parser contract', /parsePropertySyntax/.test(audit1409) && /parseProperties/.test(audit1409)],
  ['phase audit is registered in package scripts', Boolean(packageJson.scripts['audit:phase2476-upstream-syntax-parser-ownership'])],
];
const failed = checks.filter(([, passed]) => !passed);
console.log(JSON.stringify({ phase: 2476, name: 'upstream-syntax-parser-ownership', passed: checks.length - failed.length, total: checks.length, failed: failed.map(([name]) => name), checks: checks.map(([name, passed]) => ({ name, passed })) }, null, 2));
process.exitCode = failed.length ? 1 : 0;
