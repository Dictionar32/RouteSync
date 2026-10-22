const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/controllerResourceBindingInterface.ts');
const authority = read('src/types/upstream/controllerResourceBindingAuthority.ts');
const wiring = read('src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const action = read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const checks = [
  ['existing resource-binding authority owns canonical publication', /publishResolved: \(input: ControllerResourceBindingPublicationInput\) => ControllerResourceBinding/.test(contract) && /publishResolved: \(input: ControllerResourceBindingPublicationInput\) => Object\.freeze/.test(authority)],
  ['publication input carries exact source provenance and closed domain facts', /readonly source: SourceSpan/.test(contract) && /readonly resourceName: ResourceName/.test(contract) && /readonly model: ControllerModelOrigin/.test(contract)],
  ['action judgment delegates resource publication to the existing authority', /controllerResourceBindingAuthority\.publishResolved\(/.test(wiring)],
  ['action adapter no longer reconstructs resource-reference ADT inline', !/resource: Object\.freeze\(\{ kind: 'resource_reference'/.test(wiring)],
  ['resource publication obligation is closed structurally', /publicationRemainder: readonly \[\]/.test(action) && /publicationRemainder: Object\.freeze\(\[\] as const\)/.test(action)],
  ['action coverage remains partial while source AST projection remains open', /kind: 'action_semantic_knowledge_partial'/.test(action) && /kind: 'body_source_ast'/.test(action)],
  ['action contract version 31 is synchronized', /readonly version: 31;/.test(action) && /version: 31 as const/.test(wiring)],
  ['existing integrated response pipeline retains response authority', /LaravelControllerResponseSemanticPipelineInterface/.test(action) && /judgeIntegratedResponse/.test(read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts'))],
  ['new wiring does not import relation or foundation modules', !/semantic\/(relations|foundation)\//.test(wiring)],
  ['resource publication regression test exists', fs.existsSync(path.join(root, 'src/types/upstream/__tests__/controller-resource-binding-canonical-publication.phase2234.test.ts'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
