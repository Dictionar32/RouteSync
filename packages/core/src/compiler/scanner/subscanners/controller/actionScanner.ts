/** Scan a controller AST into the legacy action descriptor through one semantic contract. */
import type { ControllerMethodAst } from '../../lexer/controllerAstTypes';
import type { RequestType } from '../../../artifacts/RequestTypesArtifact';
import type { ControllerActionInfo } from '../../descriptors/requestDescriptors';
import { ScannedControllerActionDescriptor } from '../../descriptors/requestDescriptors';
import { ScannedFormRequestDescriptor } from '../../../../types/route';
import { resolveControllerActionContract } from '../../descriptors/request/controllerActionContract';

export function scanControllerAction(
  method: ControllerMethodAst,
  controllerName: string,
  fullPath: string,
  formRequestMap: ReadonlyMap<string, RequestType>,
  projectRoot: string
): { readonly actionName: string; readonly descriptor: ControllerActionInfo } {
  const contract = resolveControllerActionContract(method, controllerName, fullPath, {
    formRequestMap,
    projectRoot
  });
  const formRequests = contract.request.kind === 'form_request'
    ? [ScannedFormRequestDescriptor.create(contract.request.typeName, fullPath)]
    : [];
  const schemaRules = contract.body.schemaRules;
  const errorResponses = contract.body.errorResponses;
  const descriptor = ScannedControllerActionDescriptor.create({
    controllerName: contract.identity.controllerName,
    actionName: contract.identity.actionName,
    response: contract.response,
    sourceFile: contract.sourceFile,
    sourceLine: contract.sourceLine,
    formRequests,
    schema: contract.schema,
    schemaRules,
    resourceModelMap: new Map<string, string>(),
    errorResponses
  });
  return { actionName: contract.identity.actionName, descriptor };
}
