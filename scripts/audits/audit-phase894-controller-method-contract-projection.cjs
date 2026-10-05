const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const controller = read('packages/core/src/types/upstream/controller.ts');
const ast = read('packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts');
const result = {
  phase: 894,
  title: 'controller method contract projection and Laravel method attribute evidence',
  classification: 'UPSTREAM_CONTROLLER_METHOD_CONTRACT_CANONICAL_PROJECTION',
  checks: {
    methodAttributeEvidence: /readonly attributes: readonly ControllerParameterAttributeAst\[\]/.test(ast),
    parserProducesMethodAttributes: /parseControllerMethodAttributes/.test(parser) && /attributes: parseControllerMethodAttributes/.test(parser),
    visibilityProjection: /controllerMethodVisibilityFromMethod/.test(canonical),
    implicitPhpVisibilityProjectsPublic: /implicit: \(\) => \(\{ kind: 'public'/.test(canonical),
    operationProjectionExists: /controllerOperationsFromMethod/.test(canonical),
    contractProducerExists: /controllerMethodContractFromMethod/.test(canonical),
    producerEmitsContracts: /readonly methods: Sequence<import\('\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/controller'\).ControllerMethodContract>/.test(producer) && /methods: contracts/.test(producer),
    failureDoesNotInventException: /kind: 'http_abort'; readonly status: HttpStatusCode/.test(controller) && !/readonly exception: ExceptionName/.test(controller),
    operationProjectionIsEvidenceBound: /semanticDataflow\.resources/.test(canonical) && /response.kind, 'response_present'/.test(canonical),
  },
  findings: {
    laravel13: 'Method-level PHP attributes are captured generically; Laravel Middleware/Authorize interpretation can be added as a semantic relation without changing the parser boundary.',
    safeOperations: 'Current contract projection emits only resource and response operations because those have canonical controller semantic evidence.',
    deferredOperations: 'model_query, model_write, request_validation, database_table, and external_service remain deferred until their canonical relation producers are connected.',
    failure: 'HTTP abort status remains the only failure fact unless exception identity is directly resolved from source evidence.',
  },
};
console.log(JSON.stringify(result, null, 2));
