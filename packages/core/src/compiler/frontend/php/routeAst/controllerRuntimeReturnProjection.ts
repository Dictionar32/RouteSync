import type { ControllerRuntimeReturnProjectionInterface } from '../../../../types/upstream/controllerRuntimeReturnProjectionInterface';
import type { ControllerMethodAst } from '../controllerAstTypes';
import { phpAstExpressionProjectionOperations } from './phpAstExpressionSemanticAuthority';

/** AST-only projection. The semantic return judgment remains owned by ControllerReturnSemanticProductionInterface. */
export const controllerRuntimeReturnProjection: ControllerRuntimeReturnProjectionInterface<ControllerMethodAst> = Object.freeze({
  kind: 'controller_runtime_return_projection',
  contractVersion: 1,
  provenance: 'expressions-are-projected-with-the-exact-source-file-from-the-invocation',
  project: ({ method, sourceFile }) => Object.freeze(method.returns.length === 0
    ? { kind: 'none' as const }
    : {
        kind: 'expressions' as const,
        expressions: Object.freeze(method.returns.map(item => phpAstExpressionProjectionOperations.projectExpression(item.expression, sourceFile.value.value))),
      }),
});
