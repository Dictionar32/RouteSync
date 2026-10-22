const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['upstream authority interface owns a single derive operation', /interface ControllerDataflowSemanticJudgmentAuthorityInterface[\s\S]*readonly derive:/.test(read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts'))],
  ['per-analysis authority input binds evidence and invocation without exposing internal orchestration dependencies', ['semanticKnowledgeProjection', 'statementPayloads', 'invocationJudgment', 'definitionProjectionAuthority'].every(term => read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts').includes(term)) && !['correspondenceAuthority', 'variableIdentityAuthority', 'variableFlowCompositionAuthority', 'invocationResponseComposition'].some(term => read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts').includes(term))],
  ['authority returns a named closed semantic judgment', read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts').includes("readonly kind: 'controller_dataflow_semantic_judgment'") && read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts').includes("kind: 'controller_dataflow_semantic_judgment'")],
  ['AST is a projection of the authority-produced closed judgment', read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts').includes('extends ControllerDataflowSemanticJudgment<ControllerDataflowPayload>')],
  ['authority retains explicit unresolved correspondence and identity outcomes', ['controller_dataflow_binding_correspondence_unresolved', 'controller_dataflow_binding_identity_unresolved'].every(term => read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts').includes(term))],
  ['definition projection only occurs after matched correspondence and resolved identity', /kind: 'controller_dataflow_binding_semantics_resolved'[\s\S]*definition: input\.definitionProjectionAuthority\.project/.test(read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts'))],
  ['invocation judgment and integrated response remain separate model fields', ['invocationSemanticIntegratedResponse: integratedResponse', 'invocationJudgment: input.invocationJudgment'].every(term => read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts').includes(term))],
  ['analyzer delegates binding semantics to one upstream authority', /semanticJudgmentAuthority\.derive\(/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'))],
  ['analyzer no longer classifies correspondence or identity outcomes', !/relationRefine|relationSelect|variableIdentityAuthority\.resolve|correspondenceAuthority\.judge/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'))],
  ['PHP-specific definition projection is isolated behind a typed adapter', /ControllerDataflowDefinitionProjectionAuthorityInterface/.test(read('packages/core/src/compiler/scanner/lexer/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts'))],
  ['upstream barrel exports the interface and authority', ['controllerDataflowSemanticJudgmentAuthorityInterface', "controllerDataflowSemanticJudgmentAuthority'"].every(term => read('packages/core/src/types/upstream/index.ts').includes(term))],
  ['Laravel scanner contract records the new upstream ownership boundary', scannerContract.includes('ControllerDataflowSemanticJudgmentAuthorityInterface-owns-correspondence-to-identity-closure-variable-flow-and-integrated-response-composition') && scannerContract.includes('version: 90')],
  ['no type assertion introduced in the migrated authority/analyzer/adapter', !/\sas\s/.test(['packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts','packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts','packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts','packages/core/src/compiler/scanner/lexer/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts'].map(read).join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
