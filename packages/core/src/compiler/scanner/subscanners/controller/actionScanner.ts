/** Scan a controller AST into the legacy action descriptor through one semantic contract. */
import type { ControllerMethodAst } from '../../lexer/controllerAstTypes';
import type { ActionName, ControllerName, SourceFile } from '../../../../types/upstream/names';
import type { FormRequestSource } from '../../../../types/domain/request';
import type { ControllerActionInfo } from '../../descriptors/requestDescriptors';
import type { SourceProjectIdentity } from '../../../../types/upstream/highLevelSourceModel';
import { ScannedControllerActionDescriptor } from '../../descriptors/requestDescriptors';
import { resolveControllerActionContract } from '../../descriptors/request/controllerActionContract';

export function scanControllerAction(
  method: ControllerMethodAst,
  controllerName: ControllerName,
  fullPath: SourceFile,
  formRequestMap: ReadonlyMap<string, FormRequestSource>,
  sourceProject: SourceProjectIdentity
): { readonly actionName: ActionName; readonly descriptor: ControllerActionInfo } {
  const contract = resolveControllerActionContract(method, controllerName, fullPath, {
    formRequestMap,
    sourceProject
  });
  const errorResponses = contract.body.errorResponses;
  const descriptor = ScannedControllerActionDescriptor.create({
    controllerName: contract.identity.controllerName,
    actionName: contract.identity.actionName,
    response: contract.response,
    runtimeReturn: contract.runtimeReturn,
    sourceFile: contract.sourceFile,
    sourceLine: contract.sourceLine,
    request: contract.request.kind === 'form_request'
      ? { kind: 'form_request', source: contract.request.source }
      : { kind: 'no_request' },
    schema: contract.schema,
    dataflow: contract.dataflow,
    errorResponses
  });
  return { actionName: contract.identity.actionName, descriptor };
}
