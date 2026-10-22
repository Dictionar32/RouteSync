const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const astCanonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const resolver = read('packages/core/src/compiler/scanner/subscanners/controller/controllerBodyResolver.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['body semantic knowledge has an explicit upstream contract', /export interface LaravelControllerActionBodySemanticKnowledge/.test(judgment)],
  ['body statements use canonical upstream SourceStatements', /readonly statements: SourceStatements/.test(judgment) && /\.\/sourceStatements/.test(judgment)],
  ['body errors use existing domain HttpErrorResponseDescriptor', /readonly errorResponses: readonly HttpErrorResponseDescriptor\[\]/.test(judgment) && /domain\/httpErrors/.test(judgment)],
  ['action semantic knowledge publishes body semantic knowledge', /readonly body: LaravelControllerActionBodySemanticKnowledge/.test(judgment)],
  ['coverage publishes body as semantic knowledge', /publishedKnowledge: readonly \['actionName', 'response', 'dependencies', 'returns', 'resourceBindings', 'request', 'dataflow', 'schema', 'body'\]/.test(judgment)],
  ['only body source AST remains in projection', /readonly projectionRemainder: readonly LaravelControllerActionProjectionRemainder\[\]/.test(judgment)],
  ['coverage does not falsely claim the source AST is canonical', /body-source-ast-remains-in-the-projection/.test(judgment) && /resource-binding-judgment-is-upstream-owned-but-domain-publication-still-traverses-the-legacy-action-adapter/.test(judgment)],
  ['action judgment contract advances coherently to version 14', /readonly version: 14;/.test(judgment) && /version: 14 as const/.test(dependencies)],
  ['action projection publishes canonical body judgment statements', /statements: result\.contract\.bodySemanticJudgment\.statements/.test(dependencies)],
  ['action projection publishes authority-closed body error descriptors', /errorResponses: result\.contract\.bodySemanticJudgment\.errorResponses/.test(dependencies)],
  ['canonical statement projector returns SourceStatements', /export function controllerStatements\([\s\S]*\): SourceStatements/.test(astCanonical)],
  ['legacy body resolver remains an AST evidence resolver', /resolveControllerBody\(body: ControllerBodyAst, sourceFile: SourceFile\)/.test(resolver)],
  ['exact invocation judgment remains attached', /readonly invocationJudgment: TInvocationJudgment/.test(judgment) && /invocationJudgment: input\.invocationJudgment/.test(dependencies)],
  ['runtime executor forwards completed judgment unchanged', /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['scanner continues consuming semantic judgment separately from projection', /result\.semanticJudgment\.semantic/.test(scanner) && /result\.semanticJudgment\.projection/.test(scanner)],
  ['integrated response remains controller-wide', /judgeIntegratedResponse\(/.test(scanner) && /LaravelControllerResponseSemanticPipelineInterface/.test(responsePipeline)],
  ['new body knowledge contract is publicly exported', /LaravelControllerActionBodySemanticKnowledge/.test(index)],
  ['no duplicate foundation/relation semantic layer is introduced', !/types\/upstream\/(?:foundation|relation)/.test(judgment + dependencies)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: body statements and resolved error responses now flow through the source-bound upstream body judgment; the legacy action contract still retains body AST projection and request-binding derivation debt; resource-binding judgment is already upstream-owned and only canonical publication remains adapter-owned; schema provenance is owned by the source-correlated judgment.\n');
process.exitCode = failures === 0 ? 0 : 1;
