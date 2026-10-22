const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['integration interface declares outcome-specific overloads', () => {
    const source = read('src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
    return source.includes("evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>")
      && source.includes("evidence: Exclude<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>")
      && source.includes("readonly inputOutcomeClosure: 'not-connected-evidence-is-typed-to-not-connected-only;connected-or-source-binding-rejected-evidence-cannot-produce-not-connected'");
  }],
  ['integration executor implements the declared overloads', () => {
    const source = read('src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
    return (source.match(/function project\(/g) ?? []).length === 4
      && source.includes('function projectConnectedResult(') === false
      && source.includes('Exclude<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: \'php_source_invocation_integration_not_connected\' }>');
  }],
  ['source-binding projection excludes not-connected evidence', () => {
    const source = read('src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
    return source.includes("): Exclude<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }> => {");
  }],
  ['invocation authority uses the existing integration contract', () => {
    const source = read('src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
    return source.includes('this.dependencies.integration.project(phpSourceInvocationPipelineEvidenceFromSourceBinding(binding))')
      && source.includes('LaravelControllerInvocationProvidedPipelineJudgment');
  }],
  ['integrated response remains correlated to the exact invocation judgment', () => {
    const source = read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
    return source.includes('judgeIntegratedResponse: <InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>')
      && source.includes('LaravelControllerIntegratedResponseJudgment<InvocationJudgment>')
      && source.includes('response-judgment-is-indexed-by-the-controller-artifact-invocation-outcome');
  }],
  ['production scanner passes the same invocation judgment into response integration and AST projection', () => {
    const source = read('src/compiler/scanner/wiring/laravelControllerScanner.ts');
    return source.includes('invocationJudgment,')
      && source.includes('this.responseSemanticPipeline.judgeIntegratedResponse(')
      && source.includes("kind: 'integrated_invocation_response_judgment'")
      && source.includes('responseJudgment,');
  }],
  ['no relation/foundation layer added to upstream integration', () => {
    const source = read('src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
    return !source.includes('/semantic/relations') && !source.includes('/semantic/foundation');
  }],
];
let failed = 0;
for (const [name, test] of checks) {
  const passed = test();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
