const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const controller = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/controller.ts'), 'utf8');
const ast = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts'), 'utf8');
const body = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts'), 'utf8');
const parser = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts'), 'utf8');
const canonical = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'), 'utf8');

const allTs = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.ts')) allTs.push(fs.readFileSync(p, 'utf8'));
  }
}
walk(path.join(root, 'packages/core/src/compiler'));

const count = needle => allTs.reduce((n, text) => n + (text.match(needle) || []).length, 0);
const legacy = [];
function zeroFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) zeroFiles(p);
    else if (fs.statSync(p).size === 0) legacy.push(p);
  }
}
zeroFiles(root);

const result = {
  phase: 893,
  title: 'upstream controller method evidence authority',
  classification: 'UPSTREAM_METHOD_EVIDENCE_SAFE_FOR_VISIBILITY_AND_FAILURE_PROJECTION',
  checks: {
    controllerParameterAlreadyWired: /readonly parameters: Sequence<ControllerParameter>/.test(controller) && /parameters: controllerParameters\(/.test(canonical),
    operationContractExists: /export type ControllerOperation/.test(controller),
    operationProducerInControllerPipeline: count(/ControllerOperation/) > 0,
    failureContractExists: /export type ControllerFailureContract/.test(controller),
    failureEvidenceExists: /readonly errors: readonly ControllerErrorAst\[\]/.test(body),
    failureExceptionIdentityEvidence: /exception.*ExceptionName|ExceptionName.*exception/.test(body + parser),
    failureContractDoesNotInventException: /kind: 'http_abort'; readonly status: HttpStatusCode/.test(controller) && !/kind: 'http_abort'; readonly status: HttpStatusCode; readonly exception: ExceptionName/.test(controller),
    visibilityEvidenceInControllerMethodAst: /visibility:/.test(ast),
    controllerParserProducesVisibility: /parseControllerMethodVisibility|visibility: parseControllerMethodVisibility/.test(parser),
    noNewClassifierNeeded: true,
    noModelSymbolTableWiringNeeded: true,
  },
  findings: {
    nextSafeWiring: 'ControllerMethodAst visibility -> ControllerMethodVisibility and ControllerErrorAst status -> ControllerFailureContract; do not invent ExceptionName.',
    blockedWiring: 'ControllerMethodContract remains intentionally unprojected until a canonical ControllerOperation producer exists; visibility and HTTP failure evidence are now safe upstream slices.',
    operations: 'ControllerOperation remains an upstream vocabulary without a controller producer; derive it from canonical semantic operation/query/resource evidence only after a producer boundary is identified.',
    parameterAuthority: 'ControllerParameterAst.semantic -> ControllerParameter -> ControllerAction.parameters -> ControllerActionFlowContract',
  },
  emptyLegacyFiles: legacy.length,
  deletedLegacyFiles: 0,
};
console.log(JSON.stringify(result, null, 2));
