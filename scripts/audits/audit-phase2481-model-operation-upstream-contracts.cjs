const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/modelProducerInterface.ts');
const parser = read('packages/core/src/compiler/scanner/subscanners/model/modelParser.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts');
const scanner = read('packages/core/src/compiler/scanner/laravelModelScanner.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['semantic model formation operation has an upstream-owned contract', /export interface ModelSemanticDefinitionFromAstInterface<DeclarationEvidence, PropertyEvidence>/.test(upstream) && /readonly form:/.test(upstream)],
  ['model AST projection operation has an upstream-owned contract', /export interface ModelAstFromSemanticInterface/.test(upstream) && /readonly project:/.test(upstream)],
  ['semantic model formation uses export const name: interface = Object.freeze', /export const modelSemanticDefinitionFromAst:\s*ModelSemanticDefinitionFromAstInterface<ModelDeclarationAst, PhpClassPropertyAst>\s*= Object\.freeze/.test(parser)],
  ['AST projection uses export const name: interface = Object.freeze', /export const modelAstFromSemantic:\s*ModelAstFromSemanticInterface\s*= Object\.freeze/.test(canonical)],
  ['scanner invokes explicitly modeled upstream operations', /modelSemanticDefinitionFromAst\.form\(/.test(scanner) && /modelAstFromSemantic\.project\(/.test(scanner)],
  ['subscanner modules no longer define their own duplicate operation interfaces', !/export interface ModelSemanticDefinitionFromAstInterface/.test(parser) && !/export interface ModelAstFromSemanticInterface/.test(canonical)],
  ['upstream contract has no compiler lexer or relation/foundation imports', !/compiler\/scanner\/lexer|semantic\/(?:relations|foundation)/.test(upstream)],
  ['phase audit registered', Boolean(packageJson.scripts['audit:phase2481-model-operation-upstream-contracts'])],
];
const failed = checks.filter(([, passed]) => !passed);
const openBlockers = [
  'The model semantic formation and AST projection operations are now explicitly contracted upstream, but their implementations remain in the existing subscanners/model files; no files were moved.',
  'The model formation implementation still consumes lexer-owned AST evidence at the scanner boundary. The upstream contract is generic and does not import lexer types, but migration of parser evidence ownership remains open.',
  'Repository-wide subscanner and lexer retirement is not established; other active consumers must be traced before deleting either layer.',
  'Repository-wide semantic/relations and semantic/foundation dependency closure remains open.',
  'Full typecheck, build, Vitest, and end-to-end CLI verification are not asserted by this structural audit.',
];
console.log(JSON.stringify({phase:2481,name:'model-operation-upstream-contracts',passed:checks.length-failed.length,total:checks.length,failed:failed.map(([name])=>name),checks:checks.map(([name,passed])=>({name,passed})),openBlockers},null,2));
process.exitCode = failed.length ? 1 : 0;
