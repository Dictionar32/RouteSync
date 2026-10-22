const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/laravelModelScanner.ts');
const contract = read('packages/core/src/types/upstream/modelProducerInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const oldProducer = path.join(root, 'packages/core/src/compiler/scanner/subscanners/modelProducer.ts');
const syntaxContract = read('packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts');
const checks = [
  ['scanner consumes the existing upstream producer operation', /modelProducer\.produceResult\(/.test(scanner)],
  ['producer implementation is no longer in subscanners', !fs.existsSync(oldProducer)],
  ['producer operation is an interface-typed exported const', /export const modelProducer:\s*ModelProducerInterface<ModelDeclarationAst, PhpClassPropertyAst>\s*= Object\.freeze/.test(scanner)],
  ['upstream producer contract owns the result operation', /export interface ModelProducerInterface/.test(contract) && /readonly produceResult:\s*\(input: ModelProducerInput<DeclarationEvidence, PropertyEvidence>\) => ModelProducerResult/.test(contract)],
  ['redundant AST-only producer operation remains absent', !/readonly produce:\s*\(input: ModelProducerInput\) => ModelAst/.test(contract)],
  ['upstream contract has no direct relation/foundation import', !/semantic\/(?:relations|foundation)/.test(contract)],
  ['existing upstream syntax parser contract remains available', /interface SourceAstSyntaxParserInterface/.test(syntaxContract)],
  ['phase audit remains registered', Boolean(packageJson.scripts['audit:phase2479-model-producer-contract-closure'])],
];
const failed = checks.filter(([, passed]) => !passed);
const openBlockers = [
  'The concrete scanner binds syntax evidence types at the compiler boundary; the upstream contract does not import lexer types.',
  'Producer still delegates semantic construction and AST projection to subscanners/model/modelParser.ts and subscanners/model/modelCanonical.ts.',
  'Other scanner/subscanner consumers and repository-wide semantic/relations and semantic/foundation dependencies remain to be traced and migrated.',
];
console.log(JSON.stringify({phase:2479,name:'model-producer-contract-closure-superseded-by-phase2480',passed:checks.length-failed.length,total:checks.length,failed:failed.map(([name]) => name),checks:checks.map(([name,passed]) => ({name,passed})),openBlockers}, null, 2));
process.exitCode = failed.length ? 1 : 0;
