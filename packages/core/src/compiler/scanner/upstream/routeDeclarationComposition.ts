/**
 * Upstream route declaration composition and producer-input authority.
 * It consumes closed source evidence and injected semantic authorities, then emits canonical
 * route boundaries and producer inputs. Runtime scanner wiring only invokes this contract.
 */

import path from "path";
import { HttpMethod, RouteHandlerKind, VoidResponseDescriptor } from '../../../types/route';
import { numberValue } from '../../../types/upstream/valueObjects';
import type { ResourceName, PropertyName, SourceFile } from '../../../types/upstream/names';
import type { Presence } from '../../../types/upstream/presence';
import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { LaravelRouteSourceSelectionIntent } from '../../../types/upstream/laravelRouteSourceSelection';
import { createDomainTypeName, createRouteParameterName, stringValue } from '../../../types/upstream/names';
import type { RouteGroupFact } from '../../../types/upstream/routeGroupFacts';
import type { LaravelRouteAuthorizationSemanticJudgment } from '../../../types/upstream/routeAuthorizationSemanticJudgmentInterface';
import type { RouteBoundaryContract, RouteMethod, RouteTarget, RouteAuthentication, RouteSpecialKind, RouteGroupContext, RouteSecurityContract, RouteDefaults, RouteTransportContract, RouteDomain, RouteProducerInput, RouteFileContext } from '../../../types/upstream/route';
import { RouteBoundaryContractFactory, type RouteBoundaryOptions } from '../resolvers';
import type { StandardRouteTarget } from './routeBoundaryEmitter';
import type { ResolvedLaravelRoutePath } from '../../../types/upstream/routePathResolution';
import type { RouteMethods, RouteParameters, Sequence } from '../../../types/upstream/collections';
import type { RouteDeclarationEvidence } from '../../../types/upstream/routeDeclarationEvidence';
import type { RouteDeclarationAst } from '../lexer/routeAst';
import type { EndpointRequestBinding, EndpointResponseBinding } from '../../../types/upstream/endpointBindings';
import type { LaravelControllerMethodResponseProduct } from '../../../types/upstream/laravelControllerResponseSemanticJudgmentInterface';
import type { RouteRequestBinding } from '../../../types/domain/request';
import type { ControllerActionJudgmentPublication, ControllerActionJudgmentRouteSelection, LaravelControllerScanJudgment } from '../../../types/upstream/laravelControllerScannerInterface';
import type { ControllerPolicyRelation } from '../../../types/upstream/controller';
import type { BlockedEffectiveControllerActionPolicy, EffectiveControllerActionPolicyCatalogEntry, EffectiveControllerActionPolicyCatalogJudgment, EffectiveControllerActionPolicy } from '../../../types/upstream/effectiveControllerActionPolicy';
import type { LaravelRouteDeclarationCompositionAuthorityInterface, LaravelRouteDeclarationMethodJudgment, LaravelRoutePolicyProjectionInput, LaravelRouteScannerInterface, LaravelRouteScanJudgment, LaravelRouteScanOutcome, LaravelRouteSourceObservationInput, LaravelRouteSourceObservationJudgment } from '../../../types/upstream/laravelRouteScannerInterface';
import { matchRouteHandler } from '../../../types/domain/routeHandlers';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { operationIdentityCapabilityAuthority } from '../../../types/upstream/operationIdentityCapabilityAuthority';
import { createRequestName, createMiddlewareName, createActionName, createSourceFile, createControllerName, createPropertyName } from '../../../types/upstream/names';
import { routeSourceFileContextKnowledge } from '../lexer/routeAst/routeDataFlow';
import { type ControllerActionInfo } from '../descriptors/requestDescriptors';
import { routeBoundaryEmitter } from './routeBoundaryEmitter';
import { buildRouteMiddlewareSemanticInput, middlewareNames } from './route/routeMiddlewareSemanticInputBuilder';
import { projectRouteResourceMiddleware } from './route/resourceMiddlewareProjection';
import { buildRouteHandler } from '../descriptors/request/controllerActionTypes';
import { emptyRouteSchemaPayload } from '../../../types/domain/validationRules';
import { routeGroupContextResolver } from '../descriptors/route/routeGroupContextResolver';
import type { ControllerReturnSemanticProductionInterface } from '../../../types/upstream/controllerReturnSemanticProductionInterface';
import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';
import { operationIdentityProjection } from '../wiring/operationIdentityProjection';

const ROUTE_SOURCE_FILE_NAMES: readonly string[] = Object.freeze(['api.php', 'web.php']);

export interface RouteDeclarationEvidenceProjectionInterface {
    readonly fromAst: (
        declaration: RouteDeclarationAst,
        sourceFile: string,
        returnSemanticProduction: ControllerReturnSemanticProductionInterface<readonly PhpAstValue[]>,
    ) => RouteDeclarationEvidence;
}

export const routeDeclarationEvidenceProjection: RouteDeclarationEvidenceProjectionInterface = Object.freeze({
    fromAst: (
        declaration: RouteDeclarationAst,
        sourceFile: string,
        returnSemanticProduction: ControllerReturnSemanticProductionInterface<readonly PhpAstValue[]>,
    ): RouteDeclarationEvidence => Object.freeze({
    method: declaration.method,
    targetMethods: declaration.targetMethods,
    path: declaration.path,
    resource: {
        actionFilter: declaration.resourceActionFilter === undefined
            ? { kind: 'absent' as const }
            : declaration.resourceActionFilter.kind === 'only'
                ? { kind: 'only' as const, actions: declaration.resourceActionFilter.actions }
                : { kind: 'except' as const, actions: declaration.resourceActionFilter.actions },
        shallow: declaration.resourceShallow,
        scoped: declaration.resourceScoped,
        creatable: declaration.resourceCreatable,
        destroyable: declaration.resourceDestroyable,
    },
    target: (() => {
        switch (declaration.target.kind) {
            case 'controller_action':
                return { kind: 'controller_action' as const, controller: declaration.target.controller, action: declaration.target.action };
            case 'controller_invokable':
                return { kind: 'controller_invokable' as const, controller: declaration.target.controller };
            case 'closure':
                return { kind: 'closure' as const, action: declaration.target.action, returnSemantic: returnSemanticProduction.produce(Object.freeze({ method: declaration.target.returns, sourceFile: createSourceFile(sourceFile), responseReferenceJudgment: Object.freeze({ kind: 'response_reference_not_declared' as const }) })) };
            case 'unsupported':
                return { kind: 'unsupported' as const, reason: declaration.target.reason };
        }
    })(),
    bindings: declaration.bindings.map(value => ({ parameter: value.parameter, customKey: value.customKey === undefined ? { kind: 'absent' as const } : value.customKey })),
    prefix: declaration.prefix,
    middleware: declaration.middleware,
    routeMiddleware: declaration.routeMiddleware,
    resourceMiddleware: declaration.resourceMiddleware,
    resourceMiddlewareExclusions: declaration.resourceMiddlewareExclusions,
    groupNamePrefix: declaration.groupNamePrefix,
    groupController: declaration.groupController === undefined ? { kind: 'absent' as const } : declaration.groupController,
    groupDomain: declaration.groupDomain === undefined ? { kind: 'absent' as const } : declaration.groupDomain,
    groupBindingScope: declaration.groupBindingScope,
    missingHandler: declaration.missingHandler,
    withTrashed: declaration.withTrashed,
    routeConstraints: declaration.routeConstraints.map(value => ({ method: value.method, parameter: value.parameter, argument: value.argument })),
    groupConstraints: declaration.groupConstraints.map(value => ({ method: value.method, parameter: value.parameter, argument: value.argument })),
    source: { type: declaration.source.type, value: declaration.source.value, line: declaration.source.line, startOffset: declaration.source.startOffset, endOffset: declaration.source.endOffset },
    end: { type: declaration.end.type, value: declaration.end.value, line: declaration.end.line, startOffset: declaration.end.startOffset, endOffset: declaration.end.endOffset },
    span: Object.freeze({
        kind: 'source_span' as const,
        file: SemanticValueFactory.sourceFilePath(sourceFile),
        start: Object.freeze({ kind: 'number_value' as const, value: declaration.source.startOffset }),
        end: Object.freeze({ kind: 'number_value' as const, value: declaration.end.endOffset }),
    }),
    }),
});

const toRouteMethod = (httpMethod: HttpMethod): Exclude<RouteMethod, { readonly kind: 'match' }> => {
    switch (httpMethod) {
        case HttpMethod.GET: return { kind: 'get' };
        case HttpMethod.POST: return { kind: 'post' };
        case HttpMethod.PUT: return { kind: 'put' };
        case HttpMethod.PATCH: return { kind: 'patch' };
        case HttpMethod.DELETE: return { kind: 'delete' };
        case HttpMethod.OPTIONS: return { kind: 'options' };
        case HttpMethod.HEAD: return { kind: 'head' };
        case HttpMethod.QUERY: return { kind: 'query' };
    }
};

const sequenceFromArray = <T>(values: readonly T[]): Sequence<T> =>
    values.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

const routeResourceMiddlewareRules = (evidence: RouteDeclarationEvidence): Sequence<import('../../../types/upstream/route').RouteResourceMiddlewareRule> => {
    const rules = [
        ...evidence.resourceMiddleware.map(entry => ({ entry, exclude: false })),
        ...evidence.resourceMiddlewareExclusions.map(entry => ({ entry, exclude: true })),
    ];
    const toSequence = <T>(values: readonly T[]): Sequence<T> =>
        sequenceFromArray(values);
    const resourceScope = (entry: RouteDeclarationEvidence['resourceMiddleware'][number]): import('../../../types/upstream/routeMiddleware').RouteMiddlewareScope =>
        entry.scope.kind === 'all'
            ? { kind: 'all' }
            : entry.scope.kind === 'only'
                ? { kind: 'only', actions: Object.freeze(entry.scope.actions.map(createActionName)) }
                : { kind: 'except', actions: Object.freeze(entry.scope.actions.map(createActionName)) };
    return toSequence(rules.map(({ entry, exclude }) => Object.freeze({
        kind: 'route_resource_middleware' as const,
        scope: resourceScope(entry),
        include: exclude ? { kind: 'empty' as const } : toSequence(entry.middleware.map(createMiddlewareName)),
        exclude: exclude ? toSequence(entry.middleware.map(createMiddlewareName)) : { kind: 'empty' as const },
    })));
};

const routeRequestBindingFromSemanticBinding = (
    request: ControllerActionInfo['request'],
    resourceName: import('../../../types/upstream/names').ResourceName,
): RouteRequestBinding => {
    switch (request.kind) {
        case 'no_request':
            return Object.freeze({ kind: 'no_request' });
        case 'form_request':
            return Object.freeze({
                kind: 'form_request',
                identity: Object.freeze({ source: request.source.identity, resource: resourceName }),
                source: request.source,
            });
        case 'framework_request':
            return Object.freeze({ kind: 'framework_request', type: request.type });
        case 'typed':
            return Object.freeze({ kind: 'typed_request', type: request.type });
        case 'typed_unresolved':
            return Object.freeze({ kind: 'unresolved_request', judgment: request.judgment });
    }
};

const routeRequestBindingFromActionJudgment = (
    publication: import('../../../types/upstream/laravelControllerScannerInterface').ControllerActionJudgmentPublication,
    resourceName: import('../../../types/upstream/names').ResourceName,
): RouteRequestBinding => routeRequestBindingFromSemanticBinding(publication.judgment.semantic.request, resourceName);

const routeRequestBindingFromSelection = (
    selection: ControllerActionJudgmentRouteSelection,
    resourceName: import('../../../types/upstream/names').ResourceName,
): RouteRequestBinding => {
    switch (selection.kind) {
        case 'matched_action_judgment':
            return routeRequestBindingFromActionJudgment(selection.publication, resourceName);
        case 'unmatched_action_judgment':
            return Object.freeze({ kind: 'unresolved_action_request', reason: 'action_judgment_unmatched' });
        case 'ambiguous_action_judgments':
            return Object.freeze({ kind: 'unresolved_action_request', reason: 'action_judgment_ambiguous' });
        case 'invalid_action_judgment_publication':
            return Object.freeze({ kind: 'unresolved_action_request', reason: 'action_judgment_provenance_invalid' });
    }
};

const routeBoundaryContractFromRouteFacts = (
    method: HttpMethod,
    path: ResolvedLaravelRoutePath,
    resourceName: ResourceName,
    target: StandardRouteTarget,
    authorization: LaravelRouteAuthorizationSemanticJudgment,
    middleware: readonly PropertyName[],
    sourceFile: SourceFile,
    sourceLine: number,
    sourceSpan: import('../../../types/upstream/provenance').SourceSpan,
    actionJudgmentSelection: ControllerActionJudgmentRouteSelection,
    responseProjection: EndpointResponseBinding,
): import('../../../types/upstream/route').RouteBoundaryContract => {
    const boundaryOptions: RouteBoundaryOptions = (() => {
        switch (target.kind) {
            case 'controller_action':
                return {
                origin: 'controller_action', method, path: path.path, resourceName,
                controllerName: target.action.controllerName, actionName: target.action.actionName,
                action: target.action.actionName, sourceFile: target.action.sourceFile, sourceLine: numberValue(sourceLine), sourceSpan,
                response: target.action.response, responseProjection,
                runtimeReturn: target.action.runtimeReturn, semanticReturn: target.action.semanticReturn,
                schema: target.action.schema,
                binding: {
                    operation: { controllerName: target.action.controllerName, name: target.action.actionName, handler: target.action.handler },
                    request: routeRequestBindingFromSemanticBinding(target.action.request, resourceName),
                },
                authorization, middleware, parameters: path.parameters, runtimePath: path.runtimePath,
                constantKey: SemanticValueFactory.propertyName(path.constantKey),
                errorResponses: target.action.errorResponses,
                };
            case 'controller_reference':
                return {
                origin: 'controller_reference', method, path: path.path, controllerName: target.controllerName,
                actionName: target.actionName, action: target.actionName, sourceFile, sourceLine: numberValue(sourceLine), sourceSpan,
                response: target.response, responseProjection, runtimeReturn: { kind: 'none' },
                semanticReturn: { kind: 'absent' }, schema: emptyRouteSchemaPayload(),
                binding: {
                    operation: { controllerName: target.controllerName, name: target.actionName, handler: buildRouteHandler(target.controllerName, target.actionName) },
                    request: routeRequestBindingFromSelection(actionJudgmentSelection, resourceName),
                },
                resourceName, authorization, middleware, parameters: path.parameters, runtimePath: path.runtimePath,
                constantKey: SemanticValueFactory.propertyName(path.constantKey),
                };
            case 'closure':
                return {
                origin: 'closure', method, path: path.path, actionName: target.actionName,
                action: SemanticValueFactory.actionName(`closure@${target.actionName.value.value}`),
                controllerName: SemanticValueFactory.controllerName(''), sourceFile, sourceLine: numberValue(sourceLine), sourceSpan,
                response: target.response, responseProjection, runtimeReturn: { kind: 'none' },
                semanticReturn: target.semanticReturn, schema: emptyRouteSchemaPayload(),
                binding: {
                    operation: { controllerName: SemanticValueFactory.controllerName(''), name: SemanticValueFactory.actionName(`closure@${target.actionName.value.value}`), handler: Object.freeze({
                        kind: RouteHandlerKind.Closure, actionName: target.actionName,
                        target: SemanticValueFactory.className(`closure@${target.actionName.value.value}`),
                    }) },
                    request: { kind: 'no_request' },
                },
                resourceName, authorization, middleware, parameters: path.parameters, runtimePath: path.runtimePath,
                constantKey: SemanticValueFactory.propertyName(path.constantKey),
                };
        }
    })();
    return RouteBoundaryContractFactory.create(boundaryOptions);
};

export interface RouteBoundaryContractProjectionInterface {
    readonly fromRouteFacts: (
        method: HttpMethod,
        path: ResolvedLaravelRoutePath,
        resourceName: ResourceName,
        target: StandardRouteTarget,
        authorization: LaravelRouteAuthorizationSemanticJudgment,
        middleware: readonly PropertyName[],
        sourceFile: SourceFile,
        sourceLine: number,
        sourceSpan: import('../../../types/upstream/provenance').SourceSpan,
        actionJudgmentSelection: ControllerActionJudgmentRouteSelection,
        responseProjection: EndpointResponseBinding,
    ) => import('../../../types/upstream/route').RouteBoundaryContract;
}

export const routeBoundaryContractProjection: RouteBoundaryContractProjectionInterface = Object.freeze({
    fromRouteFacts: (
        method: HttpMethod,
        path: ResolvedLaravelRoutePath,
        resourceName: ResourceName,
        target: StandardRouteTarget,
        authorization: LaravelRouteAuthorizationSemanticJudgment,
        middleware: readonly PropertyName[],
        sourceFile: SourceFile,
        sourceLine: number,
        sourceSpan: import('../../../types/upstream/provenance').SourceSpan,
        actionJudgmentSelection: ControllerActionJudgmentRouteSelection,
        responseProjection: EndpointResponseBinding,
    ) => routeBoundaryContractFromRouteFacts(method, path, resourceName, target, authorization, middleware, sourceFile, sourceLine, sourceSpan, actionJudgmentSelection, responseProjection),
});

const routeSemanticFlowFromRouteBoundary = (
    boundary: import('../../../types/upstream/route').RouteBoundaryContract,
    controllerActionPolicy: import('../../../types/upstream/presence').Presence<import('../../../types/upstream/effectiveControllerActionPolicy').EffectiveControllerActionPolicy>,
): import('../../../types/domain/routes').RouteSemanticFlow => Object.freeze({
    authorization: boundary.authorization,
    controllerActionPolicy,
    identity: boundary.identity,
    binding: boundary.binding,
    capability: boundary.capability,
    operationIdentityCapability: operationIdentityProjection.project(operationIdentityCapabilityAuthority.fromRoute(boundary.capability)),
    provenance: boundary.provenance,
    contract: boundary.contract,
});

export interface RouteSemanticFlowProjectionInterface {
    readonly project: (
        boundary: import('../../../types/upstream/route').RouteBoundaryContract,
        controllerActionPolicy: import('../../../types/upstream/presence').Presence<import('../../../types/upstream/effectiveControllerActionPolicy').EffectiveControllerActionPolicy>,
    ) => import('../../../types/domain/routes').RouteSemanticFlow;
}

export const routeSemanticFlowProjection: RouteSemanticFlowProjectionInterface = Object.freeze({
    project: (boundary, controllerActionPolicy) => routeSemanticFlowFromRouteBoundary(boundary, controllerActionPolicy),
});

const routeGroupFactFromEvidence = (evidence: RouteDeclarationEvidence): RouteGroupFact => Object.freeze({
    prefix: Object.freeze(evidence.prefix.map(stringValue)),
    middleware: Object.freeze(evidence.middleware.map(createMiddlewareName)),
    namePrefix: Object.freeze(evidence.groupNamePrefix.map(stringValue)),
    controller: typeof evidence.groupController === 'string' ? { kind: 'present' as const, value: createControllerName(evidence.groupController) } : { kind: 'absent' as const },
    domain: typeof evidence.groupDomain === 'string' ? { kind: 'present' as const, value: createDomainTypeName(evidence.groupDomain) } : { kind: 'absent' as const },
    bindingScope: evidence.groupBindingScope,
    constraints: Object.freeze(evidence.groupConstraints.map(constraint => Object.freeze({
        parameter: createRouteParameterName(constraint.parameter),
        method: constraint.method,
        argument: constraint.argument.kind === 'pattern'
            ? Object.freeze({ kind: 'pattern' as const, value: stringValue(constraint.argument.value) })
            : constraint.argument.kind === 'values'
                ? Object.freeze({ kind: 'values' as const, values: Object.freeze(constraint.argument.values.map(stringValue)) })
                : Object.freeze({ kind: 'none' as const }),
        source: Object.freeze({ kind: 'group' as const }),
    }))),
});

const controllerNameOf = (evidence: import('../../../types/upstream/routeDeclarationEvidence').RouteDeclarationEvidence['target']): Presence<string> =>
  evidence.kind === 'controller_action' || evidence.kind === 'controller_invokable'
    ? { kind: 'present', value: evidence.controller }
    : { kind: 'absent' };

const actionNameOf = (evidence: import('../../../types/upstream/routeDeclarationEvidence').RouteDeclarationEvidence): string =>
  evidence.target.kind === 'controller_action'
    ? evidence.target.action
    : evidence.target.kind === 'controller_invokable'
      ? '__invoke'
      : `closure_${evidence.source.startOffset}`;

const emitDeclaration = (
  declarationEvidence: import('../../../types/upstream/routeDeclarationEvidence').RouteDeclarationEvidence,
  methodJudgment: import('../../../types/upstream/laravelRouteDeclarationMethodJudgment').LaravelRouteDeclarationMethodJudgment,
  authorizationAuthority: LaravelRouteScannerInterface['authorizationAuthority'],
  resourceFlowAuthority: LaravelRouteScannerInterface['routeResourceFlowAuthority'],
  pathResolutionAuthority: LaravelRouteScannerInterface['routePathResolutionAuthority'],
  file: string,
  controllerScan: LaravelControllerScanJudgment,
  publications: readonly ControllerActionJudgmentPublication[],
  correlationAuthority: LaravelRouteScannerInterface['controllerActionRouteCorrelationAuthority'],
): readonly RouteBoundaryContract[] => {
  const controllerName = controllerNameOf(declarationEvidence.target);
  const actionName = actionNameOf(declarationEvidence);
  const unresolvedResponse = VoidResponseDescriptor.create();
  const middlewareNames = Object.freeze([...declarationEvidence.middleware, ...declarationEvidence.routeMiddleware].map(createMiddlewareName));
  const boundaryMiddleware = Object.freeze([...declarationEvidence.middleware, ...declarationEvidence.routeMiddleware].map(createPropertyName));
  const authorization = authorizationAuthority.judge(middlewareNames);
  switch (methodJudgment.kind) {
    case 'laravel_route_declaration_method_resource': {
      const resource = resourceFlowAuthority.resolveDeclaration({
        kind: 'route_resource_declaration_input',
        mode: methodJudgment.method,
        declaration: declarationEvidence,
      });
      return routeBoundaryEmitter.emitResourceRouteBoundariesFromJudgment(
        resource,
        controllerName.kind === 'absent' ? { kind: 'absent' as const } : { kind: 'present' as const, value: createControllerName(controllerName.value) },
        unresolvedResponse,
        authorization,
        boundaryMiddleware,
        SemanticValueFactory.sourceFilePath(file),
        declarationEvidence.source.line,
        declarationEvidence.span,
        (method, path, resourceName, target, routeAuthorization, middleware, sourceFile, sourceLine, sourceSpan) => {
          const actionSelection = actionJudgmentForTarget(target, publications, correlationAuthority);
          const responseProjection = responseProjectionForTarget(target, controllerScan, actionSelection);
          return routeBoundaryContractProjection.fromRouteFacts(method, path, resourceName, target, routeAuthorization, middleware, sourceFile, sourceLine, sourceSpan, actionSelection, responseProjection);
        },
      );
    }
    case 'laravel_route_declaration_method_query':
    case 'laravel_route_declaration_method_all_methods':
    case 'laravel_route_declaration_method_match':
    case 'laravel_route_declaration_method_standard': {
      const resolvedPath = pathResolutionAuthority.resolve({
        kind: 'laravel_route_path_resolution_input',
        declaredPath: declarationEvidence.path,
        groupPrefixes: declarationEvidence.prefix,
      });
      const target: StandardRouteTarget = controllerName.kind === 'absent'
        ? { kind: 'closure', actionName: createActionName(actionName), response: unresolvedResponse, semanticReturn: declarationEvidence.target.kind === 'closure' ? declarationEvidence.target.returnSemantic : { kind: 'absent' as const } }
        : { kind: 'controller_reference', controllerName: createControllerName(controllerName.value), actionName: createActionName(actionName), response: unresolvedResponse };
      return routeBoundaryEmitter.emitStandardRouteBoundaries(
        methodJudgment.httpMethods,
        resolvedPath,
        resolvedPath.resourceName,
        target,
        authorization,
        boundaryMiddleware,
        SemanticValueFactory.sourceFilePath(file),
        declarationEvidence.source.line,
        declarationEvidence.span,
        (method, path, resourceName, target, routeAuthorization, middleware, sourceFile, sourceLine, sourceSpan) => {
          const actionSelection = actionJudgmentForTarget(target, publications, correlationAuthority);
          const responseProjection = responseProjectionForTarget(target, controllerScan, actionSelection);
          return routeBoundaryContractProjection.fromRouteFacts(method, path, resourceName, target, routeAuthorization, middleware, sourceFile, sourceLine, sourceSpan, actionSelection, responseProjection);
        },
      );
    }
    default:
      return assertNever(methodJudgment);
  }
};

const assertNever = (value: never): never => {
    throw new Error(`Unrecognized closed route method judgment: ${String(value)}`);
};

const actionJudgmentForTarget = (
  target: StandardRouteTarget,
  publications: readonly ControllerActionJudgmentPublication[],
  correlationAuthority: LaravelRouteScannerInterface['controllerActionRouteCorrelationAuthority'],
) => {
  switch (target.kind) {
    case 'controller_action':
      return correlationAuthority.judge({
        kind: 'controller_action_route_correlation_input',
        controller: target.action.controllerName,
        action: target.action.actionName,
        publications,
      });
    case 'closure':
      return Object.freeze({ kind: 'unmatched_action_judgment' as const });
    case 'controller_reference':
      return correlationAuthority.judge({
        kind: 'controller_action_route_correlation_input',
        controller: target.controllerName,
        action: target.actionName,
        publications,
      });
  }
};

const sameMethodSource = (left: import('../../../types/upstream/provenance').SourceSpan, right: import('../../../types/upstream/provenance').SourceSpan): boolean =>
  left.file.value.value === right.file.value.value &&
  left.start.value === right.start.value &&
  left.end.value === right.end.value;

const responseProductForPublication = (
  controller: import('../../../types/upstream/laravelControllerScannerInterface').LaravelControllerScanArtifact,
  publication: ControllerActionJudgmentPublication,
): EndpointResponseBinding => {
  const judgment = controller.responseJudgment;
  const productSelection = (() => {
    switch (judgment.kind) {
      case 'controller_response_method_products_complete':
        return Object.freeze({ kind: 'products' as const, products: [judgment.product.firstMethod, ...judgment.product.remainingMethods] });
      case 'controller_response_complete':
        return judgment.product.kind === 'controller_method_response_products'
          ? Object.freeze({ kind: 'products' as const, products: [judgment.product.firstMethod, ...judgment.product.remainingMethods] })
          : Object.freeze({ kind: 'blocked' as const, reason: 'method_response_product_not_projectable' as const });
      case 'controller_response_return_semantics_complete':
        return Object.freeze({ kind: 'blocked' as const, reason: 'method_response_product_not_projectable' as const });
      default:
        return Object.freeze({ kind: 'blocked' as const, reason: 'response_judgment_unavailable' as const });
    }
  })();
  if (productSelection.kind === 'blocked') {
    return Object.freeze({ kind: 'controller_response_projection_blocked', reason: productSelection.reason });
  }
  const candidates: readonly LaravelControllerMethodResponseProduct[] = productSelection.products.filter(product =>
    product.method.action.controller.value.value === publication.controller.value.value &&
    product.method.action.action.value.value === publication.action.value.value &&
    sameMethodSource(product.method.source, publication.source),
  );
  switch (candidates.length) {
    case 0:
      return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'method_response_product_unmatched' });
    case 1:
      return candidates[0] === undefined
        ? Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'method_response_product_unmatched' })
        : Object.freeze({ kind: 'controller_method_response', product: candidates[0] });
    default:
      return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'method_response_product_ambiguous' });
  }
};

const responseProjectionForTarget = (
  target: StandardRouteTarget,
  controllerScan: LaravelControllerScanJudgment,
  selection: ControllerActionJudgmentRouteSelection,
): EndpointResponseBinding => {
  if (target.kind === 'closure') {
    return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'closure_response_not_correlated' });
  }
  switch (selection.kind) {
    case 'unmatched_action_judgment':
      return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'action_judgment_unmatched' });
    case 'ambiguous_action_judgments':
      return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'action_judgment_ambiguous' });
    case 'invalid_action_judgment_publication':
      return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'action_judgment_provenance_invalid' });
    case 'matched_action_judgment':
      if (controllerScan.kind !== 'laravel_controller_scan_complete') {
        return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'response_judgment_unavailable' });
      }
      const controllers = controllerScan.controllers.filter(controller => controller.identity.value.value === selection.publication.controller.value.value);
      switch (controllers.length) {
        case 0:
          return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'response_judgment_unavailable' });
        case 1:
          return controllers[0] === undefined
            ? Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'response_judgment_unavailable' })
            : responseProductForPublication(controllers[0], selection.publication);
        default:
          return Object.freeze({ kind: 'controller_response_projection_blocked', reason: 'response_judgment_unavailable' });
      }
  }
};



/**
 * Closed route-declaration composition operation. It consumes already-produced evidence and
 * injected upstream authorities; the runtime scanner does not choose route semantics itself.
 */
const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
    items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

const isBlockedPolicy = (policy: EffectiveControllerActionPolicy): policy is BlockedEffectiveControllerActionPolicy =>
    policy.judgment.kind === 'blocked';

export const routeDeclarationCompositionAuthority: LaravelRouteDeclarationCompositionAuthorityInterface = Object.freeze({
    kind: 'laravel_route_declaration_composition_authority' as const,
    closed: true as const,
    catalogFromControllerScan(controllerScan: LaravelControllerScanJudgment): EffectiveControllerActionPolicyCatalogJudgment {
        if (controllerScan.kind !== 'laravel_controller_scan_complete') {
            return Object.freeze({ kind: 'blocked' as const, entries: Object.freeze([]), reason: Object.freeze({ kind: 'controller_policy_inventory_unavailable' as const, controllers: Object.freeze([]) }) });
        }
        const entries: readonly EffectiveControllerActionPolicyCatalogEntry[] = Object.freeze(controllerScan.controllers.map(controller => Object.freeze({
            controller: controller.identity,
            relations: Object.freeze([
                ...controller.policyInventory,
                ...controller.actions.flatMap(action => sequenceToArray(action.policy)),
            ]),
        })));
        return Object.freeze({ kind: 'complete' as const, entries });
    },
    policyForBinding(input: LaravelRoutePolicyProjectionInput): import('../../../types/upstream/presence').Presence<EffectiveControllerActionPolicy> {
        switch (input.binding.outcome.kind) {
            case 'unresolved':
            case 'ambiguous':
                return Object.freeze({ kind: 'absent' as const });
            case 'resolved': {
                const action = input.binding.outcome.candidate.action;
                const resource = projectRouteResourceMiddleware({
                    middleware: input.declarationEvidence.resourceMiddleware,
                    middlewareExclusions: input.declarationEvidence.resourceMiddlewareExclusions,
                });
                const middleware = buildRouteMiddlewareSemanticInput({
                    route: middlewareNames(input.routeMiddleware.map(value => value.value.value)),
                    resource,
                }, { kind: 'present', value: action.action });
                const policy: readonly ControllerPolicyRelation[] = sequenceToArray(action.policy);
                return Object.freeze({ kind: 'present' as const, value: input.effectiveControllerActionPolicyAuthority.judge({
                    controller: action.controller,
                    action: action.action,
                    middleware,
                    policy,
                    policyCatalog: input.controllerPolicyCatalog,
                    inheritedFrom: action.inheritedFrom,
                    source: [action.source],
                }) });
            }
        }
    },
    resolveSourceFiles(sourceProject: SourceProjectIdentity, intent: LaravelRouteSourceSelectionIntent): readonly SourceFile[] {
        switch (intent.kind) {
            case 'laravel_route_source_selection_default':
                return Object.freeze(ROUTE_SOURCE_FILE_NAMES.map(name => createSourceFile(path.join(sourceProject.root.value.value, 'routes', name))));
            case 'laravel_route_source_selection_explicit':
                return Object.freeze([...intent.selection.files]);
        }
    },
    observeSourceFiles(input: LaravelRouteSourceObservationInput): LaravelRouteSourceObservationJudgment {
        if (input.intent.kind === 'laravel_route_source_selection_explicit' && input.missingFiles.length > 0) {
            return Object.freeze({ kind: 'laravel_route_scan_blocked', contractVersion: 27, reason: 'explicitly_selected_route_source_file_absent', missingFiles: input.missingFiles });
        }
        return Object.freeze({
            kind: 'laravel_route_source_observation_ready',
            sourceFiles: Object.freeze(input.selectedFiles.map(file => input.missingFiles.some(missing => missing.value.value === file.value.value)
                ? Object.freeze({ kind: 'laravel_route_source_file_absent_optional_default' as const, file })
                : Object.freeze({ kind: 'laravel_route_source_file_scanned' as const, file }))),
        });
    },
    outcomeFromScan(scan: LaravelRouteScanJudgment): LaravelRouteScanOutcome {
        const policies: import('../../../types/upstream/laravelRouteScannerInterface').LaravelRouteScanPolicyBlockedJudgment['policies'] = Object.freeze(scan.artifacts.flatMap(artifact => {
            const projection = artifact.flow.controllerActionPolicy;
            if (projection.kind !== 'present' || !isBlockedPolicy(projection.value)) {
                return [];
            }
            return [Object.freeze({ route: artifact.ast, policy: projection.value })];
        }));
        const responses: import('../../../types/upstream/laravelRouteScannerInterface').LaravelRouteScanResponseBlockedJudgment['responses'] = Object.freeze(scan.artifacts.flatMap(artifact => {
            const response = artifact.ast.semantic.definition.bindings.response;
            if (response.kind !== 'controller_response_projection_blocked') {
                return [];
            }
            return [Object.freeze({ route: artifact.ast, response })];
        }));
        if (responses.length > 0) {
            return Object.freeze({ kind: 'laravel_route_scan_response_blocked', contractVersion: 27, scan, responses, policies });
        }
        return policies.length === 0
            ? scan
            : Object.freeze({ kind: 'laravel_route_scan_policy_blocked', contractVersion: 27, scan, policies });
    },
    compose(input: import('../../../types/upstream/laravelRouteScannerInterface').LaravelRouteDeclarationCompositionInput): readonly import('../../../types/upstream/route').RouteBoundaryContract[] {
        return emitDeclaration(
            input.declarationEvidence,
            input.methodJudgment,
            input.authorizationAuthority,
            input.routeResourceFlowAuthority,
            input.routePathResolutionAuthority,
            input.sourceFile.value.value,
            input.controllerScan,
            input.publications,
            input.controllerActionRouteCorrelationAuthority,
        );
    },
});

const routeProducerInputFromRouteBoundary = (
        route: import('../../../types/upstream/route').RouteBoundaryContract,
        declarationEvidence: RouteDeclarationEvidence,
        source: import("../../../types/upstream/provenance").SourceSpan,
        methodJudgment: LaravelRouteDeclarationMethodJudgment,
    ): RouteProducerInput => {
        const declarationMethods = methodJudgment.kind === 'laravel_route_declaration_method_match'
            ? methodJudgment.httpMethods
            : Object.freeze([]);
        const routeIdentityMethod = toRouteMethod(route.identity.coordinates.method);
        const preservedMethods = declarationMethods.length > 0
            ? declarationMethods.map(toRouteMethod)
            : [routeIdentityMethod];
        const preservedMethodList: RouteMethods = {
            kind: 'route_methods',
            items: routeMethodsToList(preservedMethods),
        };
        const routeMethodKind = {
            laravel_route_declaration_method_resource: () => routeIdentityMethod,
            laravel_route_declaration_method_all_methods: () => ({ kind: 'any' } as const),
            laravel_route_declaration_method_query: () => routeIdentityMethod,
            laravel_route_declaration_method_match: () => ({ kind: 'match', methods: preservedMethodList } as const),
            laravel_route_declaration_method_standard: () => routeIdentityMethod,
        } as const;
        const method: RouteMethod = routeMethodKind[methodJudgment.kind]();
        const target: RouteTarget = matchRouteHandler<RouteTarget>(route.binding.operation.handler, {
            controllerAction: handler => ({
                kind: 'controller_action',
                controller: { kind: 'controller_reference', name: SemanticValueFactory.controllerName(handler.controllerName.value.value), action: handler.actionName }
            }),
            invokableController: handler => ({
                kind: 'controller_invokable',
                controller: { kind: 'controller_reference', name: SemanticValueFactory.controllerName(handler.controllerName.value.value), action: handler.actionName }
            }),
            closure: handler => ({ kind: 'closure', action: handler.actionName })
        });
        let request: EndpointRequestBinding;
        switch (route.binding.request.kind) {
            case 'form_request':
                request = { kind: 'form_request', request: { kind: 'request_reference', name: createRequestName(route.binding.request.identity.source.requestClass.value.value) } };
                break;
            case 'framework_request':
                request = { kind: 'framework_request', type: route.binding.request.type };
                break;
            case 'typed_request':
                request = { kind: 'inline_input', type: route.binding.request.type };
                break;
            case 'unresolved_request':
                request = { kind: 'unresolved_input', judgment: route.binding.request.judgment };
                break;
            case 'unresolved_action_request':
                request = { kind: 'unresolved_action_input', reason: route.binding.request.reason };
                break;
            case 'no_request':
                request = { kind: 'no_input' };
                break;
        }
        const authentication: RouteAuthentication = route.capability.auth.value
            ? {
                kind: 'authenticated',
                scheme: route.capability.security.scheme,
                guard: route.capability.security.guards.kind === 'empty'
                    ? { kind: 'none' as const }
                    : { kind: 'some' as const, value: route.capability.security.guards.head },
            }
            : { kind: 'public' };
        // RouteBoundaryContract already carries the closed parameter binding judgment.
        // RouteBoundaryContract already carries the closed parameter binding judgment.
        const parameters: RouteParameters = { kind: 'route_parameters', items: sequenceFromArray(route.identity.parameters.all) };
        const response: EndpointResponseBinding = route.binding.responseProjection;
        const domain: RouteDomain = route.identity.domain.domain.value.value.length === 0
            ? { kind: 'default' }
            : { kind: 'explicit', value: route.identity.domain.domain };
        const resourceActions = (actions: readonly string[]): Sequence<import('../../../types/upstream/names').ActionName> =>
            actions.reduceRight<Sequence<import('../../../types/upstream/names').ActionName>>(
                (tail, action) => ({ kind: 'cons', head: createActionName(action), tail }),
                { kind: 'empty' },
            );
        const resourceRegistration: import('../../../types/upstream/route').RouteResourceRegistration = {
            kind: 'route_resource_registration',
            name: route.identity.domain.resource,
            controller: matchRouteHandler<import('../../../types/upstream/route').RouteResourceController>(route.binding.operation.handler, {
                controllerAction: handler => ({
                    kind: 'conventional_controller' as const,
                    className: handler.controllerName,
                }),
                invokableController: handler => ({
                    kind: 'conventional_controller' as const,
                    className: handler.controllerName,
                }),
                closure: () => ({ kind: 'framework_convention' as const }),
            }),
            only: declarationEvidence.resource.actionFilter.kind === 'only' ? resourceActions(declarationEvidence.resource.actionFilter.actions) : { kind: 'empty' },
            except: declarationEvidence.resource.actionFilter.kind === 'except' ? resourceActions(declarationEvidence.resource.actionFilter.actions) : { kind: 'empty' },
            shallow: { kind: 'truth_value' as const, value: declarationEvidence.resource.shallow },
            scoped: { kind: 'truth_value' as const, value: declarationEvidence.resource.scoped },
            parameters: { kind: 'empty' as const },
            creatable: { kind: 'truth_value' as const, value: declarationEvidence.resource.creatable },
            destroyable: { kind: 'truth_value' as const, value: declarationEvidence.resource.destroyable },
            middleware: routeResourceMiddlewareRules(declarationEvidence),
        };
        // The closed upstream method judgment owns declaration-family meaning.
        // Do not classify declaration.method again in the route projection layer.
        const special: RouteSpecialKind = (() => {
            switch (methodJudgment.kind) {
                case 'laravel_route_declaration_method_resource':
                    switch (methodJudgment.method) {
                        case 'resource':
                            return { kind: 'resource', resource: resourceRegistration };
                        case 'apiResource':
                            return { kind: 'api_resource', resource: resourceRegistration };
                        case 'singleton':
                            return { kind: 'singleton', resource: resourceRegistration };
                        case 'apiSingleton':
                            return { kind: 'api_singleton', resource: resourceRegistration };
                    }
                case 'laravel_route_declaration_method_all_methods':
                case 'laravel_route_declaration_method_query':
                case 'laravel_route_declaration_method_match':
                case 'laravel_route_declaration_method_standard':
                    return { kind: 'standard' };
            }
        })();
        const group: RouteGroupContext = {
            ...routeGroupContextResolver.fromFact(routeGroupFactFromEvidence(declarationEvidence)),
            domain,
        };
        const security: RouteSecurityContract = {
            authentication,
            signature: { kind: 'not_signed' }
        };
        const defaults: RouteDefaults = { kind: 'route_defaults', items: { kind: 'empty' } };
        const transport: RouteTransportContract = {
            kind: 'route_transport',
            httpOnly: { kind: 'truth_value', value: false },
            httpsOnly: { kind: 'truth_value', value: false }
        };
        const sourceFile = SemanticValueFactory.sourceFilePath(route.provenance.sourceFile.value.value);
        const sourceFilePath = route.provenance.sourceFile.value.value.split(path.sep).join('/');
        const fileContext: RouteFileContext = routeSourceFileContextKnowledge(sourceFilePath);
        const producerInput: RouteProducerInput = {
            declaration: declarationEvidence,
            source,
            identity: {
                kind: 'route_identity',
                key: route.identity.coordinates.name,
                declaredName: { kind: 'none' },
                method,
                path: route.identity.coordinates.path
            },
            special,
            domain,
            group,
            bindings: { target, parameters, request, response },
            returnSemantic: route.binding.semanticReturn,
            security,
            capability: route.capability,
            defaults,
            transport,
            provenance: {
                source: sourceFile,
                span: source,
                fileContext
            }
        };
        return producerInput;
    }





function routeMethodsToList(methods: readonly Exclude<RouteMethod, { readonly kind: 'match' }>[]): RouteMethods['items'] {
    return methods.reduceRight<RouteMethods['items']>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
}


/** Explicit operation contract adapter for producer-ready route composition. */
export interface RouteProducerInputCompositionRuntimeInterface {
    readonly kind: 'route_producer_input_composition';
    readonly closed: true;
    readonly compose: (input: import('../../../types/upstream/route').RouteProducerInputCompositionInput) => RouteProducerInput;
}

export const routeProducerInputComposition: RouteProducerInputCompositionRuntimeInterface = Object.freeze({
    kind: 'route_producer_input_composition',
    closed: true,
    compose: (input: import('../../../types/upstream/route').RouteProducerInputCompositionInput): RouteProducerInput =>
        routeProducerInputFromRouteBoundary(
            input.boundary,
            input.declaration,
            input.source,
            input.methodJudgment,
        ),
});
