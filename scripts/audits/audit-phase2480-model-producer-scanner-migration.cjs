const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/laravelModelScanner.ts');
const contract = read('packages/core/src/types/upstream/modelProducerInterface.ts');
const oldProducer = path.join(root, 'packages/core/src/compiler/scanner/operations/modelProducer.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['scanner owns the interface-typed producer operation', /export const modelProducer:\s*ModelProducerInterface<ModelDeclarationAst, PhpClassPropertyAst>\s*= Object\.freeze/.test(scanner)],
  ['producer implements the existing upstream operation contract', /export interface ModelProducerInterface<DeclarationEvidence, PropertyEvidence>/.test(contract) && /produceResult:\s*\(input: ModelProducerInput<DeclarationEvidence, PropertyEvidence>\) => ModelProducerResult/.test(contract) && /produceResult:\s*\(input: ModelProducerInput<ModelDeclarationAst, PhpClassPropertyAst>\): ModelProducerResult/.test(scanner)],
  ['scanner no longer imports a producer implementation from operations', !/from [\'"]\.\/operations\/modelProducer[\'"]/.test(scanner)],
  ['old producer implementation is retired after consumer rewiring', !fs.existsSync(oldProducer)],
  ['producer still returns the paired semantic definition and AST', /return Object\.freeze\(\{ definition: ast\.definition, ast \}\)/.test(scanner)],
  ['upstream contract has no compiler lexer or relation/foundation dependency', !/compiler\/scanner\/lexer|semantic\/(?:relations|foundation)/.test(contract)],
  ['scanner has no direct relation/foundation import', !/semantic\/(?:relations|foundation)/.test(scanner)],
  ['phase audit registered', Boolean(packageJson.scripts['audit:phase2480-model-producer-scanner-migration'])],
];
const failed = checks.filter(([, passed]) => !passed);
const openBlockers = [
  'The producer operation is now wired in laravelModelScanner.ts, but its semantic builder and AST projector still import from operations/model/modelParser.ts and operations/model/modelCanonical.ts.' ,
  'ModelProducerInterface parameterizes syntax evidence so the upstream contract does not import compiler/frontend/php types.',
  'The complete Laravel scanner still contains other subscanner and lexer dependencies; repository-wide retirement is not established by this focused migration.',
  'Repository-wide semantic/relations and semantic/foundation dependency closure remains unverified.',
];
console.log(JSON.stringify({phase:2480,name:'model-producer-scanner-migration',passed:checks.length-failed.length,total:checks.length,failed:failed.map(([name])=>name),checks:checks.map(([name,passed])=>({name,passed})),openBlockers},null,2));
process.exitCode = failed.length ? 1 : 0;
