/** Scan a controller AST into the legacy action descriptor through one semantic contract. */
import { type RelationMembership, type RelationIndex } from '../../../../semantic/foundation/relationMembership';
import { relationGate } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import type { ControllerMethodAst, ControllerParameterAst } from '../../lexer/controllerAstTypes';
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
  formRequestIndex: RelationIndex<string, FormRequestSource>,
  sourceProject: SourceProjectIdentity,
  constructorParameters: readonly ControllerParameterAst[] = [],
  customContextualAttributeNames: RelationMembership<string> = Object.freeze([] as string[])
): { readonly actionName: ActionName; readonly descriptor: ControllerActionInfo; readonly dependencies: import('../../../../types/upstream/controller').ControllerDependency[] } {
  const contract = resolveControllerActionContract(method, controllerName, fullPath, {
    formRequestIndex,
    sourceProject,
    constructorParameters,
    customContextualAttributeNames
  });
  const errorResponses = contract.body.errorResponses;
  const descriptor = ScannedControllerActionDescriptor.create({
    controllerName: contract.identity.controllerName,
    actionName: contract.identity.actionName,
    response: contract.response,
    runtimeReturn: contract.runtimeReturn,
    semanticReturn: contract.semanticReturn,
    sourceFile: contract.sourceFile,
    sourceLine: contract.sourceLine,
    request: relationGate(relationEqual(contract.request.kind, 'form_request'),
      () => ({ kind: 'form_request' as const, source: contract.request.source }),
      () => relationGate(relationEqual(contract.request.kind, 'framework_request'),
        () => ({ kind: 'framework_request' as const, type: contract.request.type }),
        () => ({ kind: 'no_request' as const }))),
    schema: contract.schema,
    dataflow: contract.dataflow,
    errorResponses,
    parameters: method.parameters
  });
  return { actionName: contract.identity.actionName, descriptor, dependencies: [...contract.dependencies] };
}
