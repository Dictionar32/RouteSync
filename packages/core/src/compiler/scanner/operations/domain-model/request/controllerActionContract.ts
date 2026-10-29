import type { FormRequestSource } from '../../../../../types/domain/request';
import type { LaravelControllerRequestSemanticBinding, LaravelControllerRequestSemanticBinding as RequestBindingJudgment } from '../../../../../types/upstream/laravelControllerRequestSemanticBinding';
import { createActionName, type ActionName, type ControllerName, type SourceFile } from '../../../../../types/upstream/names';
import type { RouteSchemaPayload } from '../../../../../types/route';
import type { ControllerMethodAst, ControllerParameterAst, PhpParameterTypeAst } from '../../../../frontend/php/controllerAstTypes';
import type { ControllerRuntimeReturn } from '../../../../../types/domain/controllerExpression';
import type { PhpParameterTypeEvidence } from '../../../../../types/upstream/phpParameterTypeInterface';
import type { LaravelControllerRequestBindingEvidence } from '../../../../../types/upstream/laravelControllerRequestSemanticBindingInterface';
import { laravelControllerRequestSemanticBindingAuthority } from '../../../../../types/upstream/laravelControllerRequestSemanticBindingAuthority';
import { createRequestName } from '../../../../../types/upstream/names';
import type { ControllerDependency, ControllerResponseReferenceJudgment } from '../../../../../types/upstream/controller';
import type { ControllerDataflowAst } from '../../../../frontend/php/controllerBodyAstTypes';
import type { PhpStatement } from '../../../../frontend/php/phpAstTypes';
import type { ControllerBodySemanticJudgment } from '../../../../../types/upstream/controllerBodySemanticJudgmentInterface';
import type { ControllerActionSchemaSemanticJudgment, ControllerActionSchemaRequestEvidence, ControllerActionSchemaRouteRequestEvidence } from '../../../../../types/upstream/controllerActionSchemaSemanticJudgmentInterface';
import type { SourceRange } from '../../../../frontend/php/phpAstTypes';
import type { ControllerSemanticVariableFlow, ControllerModelOrigin } from '../../../../../types/upstream/controller';
import type { ControllerDataflowSemanticJudgment } from '../../../../../types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface';
import type { ControllerDataflowDefinitionPayloadMetadata } from '../../../../../types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface';

export interface ControllerActionIdentity {
    readonly controllerName: ControllerName;
    readonly actionName: ActionName;
}

export type ControllerRequestBinding = LaravelControllerRequestSemanticBinding;

/**
 * Controller-level request fact. It intentionally does not masquerade as the
 * route-level binding, because resource identity is not known at this origin.
 */
export type RequestContract = ControllerRequestBinding;

export type FormRequestSourceIndex = readonly (readonly [string, FormRequestSource])[];

export type RuntimeReturnContract = ControllerRuntimeReturn;

export interface ControllerActionResourceBinding {
    readonly resourceName: import('../../../../../types/domain/semanticValues').ResourceName;
    readonly model: ControllerModelOrigin;
    readonly response: import('../../../../../types/upstream/semanticReferences').ResponseReference;
    readonly source: SourceRange;
}

export interface ControllerActionBodyEvidenceProjection {
    readonly statements: readonly PhpStatement[];
    readonly dataflow: ControllerDataflowAst;
}

export interface ControllerActionDataflowContract {
    readonly semantic: ControllerSemanticVariableFlow;
    readonly resourceBindings: readonly ControllerActionResourceBinding[];
}

export interface ControllerActionContract {
    readonly identity: ControllerActionIdentity;
    readonly parameters: readonly ControllerParameterAst[];
    /** All container-resolved controller dependencies attached to this action, including constructor injection. */
    readonly dependencies: readonly ControllerDependency[];
    readonly request: RequestContract;
    /** Canonical response-presence ADT shared by return semantics, dataflow, and action judgment. */
    readonly responseReferenceJudgment: ControllerResponseReferenceJudgment;
    readonly runtimeReturn: RuntimeReturnContract;
    readonly semanticReturn: import('../../../../../types/upstream/controller').ControllerReturnSemantic;
    readonly body: ControllerActionBodyEvidenceProjection;
    readonly bodySemanticJudgment: ControllerBodySemanticJudgment<SourceFile>;
    readonly schemaSemanticJudgment: ControllerActionSchemaSemanticJudgment<SourceFile>;
    readonly dataflow: ControllerActionDataflowContract;
    /** Exact upstream dataflow judgment carried by the parsed semantic body. */
    readonly dataflowJudgment: ControllerDataflowSemanticJudgment<ControllerDataflowDefinitionPayloadMetadata>;
    readonly schema: RouteSchemaPayload;
    readonly schemaEvidence: ControllerActionSchemaRouteRequestEvidence<SourceFile>;
    readonly sourceFile: SourceFile;
    readonly sourceLine: number;
}

/**
 * Adapt parsed parameter facts into the existing upstream request-binding authority.
 * This function prepares evidence only; request-kind selection and PHP type resolution
 * remain owned by laravelControllerRequestSemanticBindingAuthority.
 */
function controllerRequestBindingEvidenceFromMethodImplementation(
    method: ControllerMethodAst,
    formRequestIndex: FormRequestSourceIndex,
): LaravelControllerRequestBindingEvidence {
    const requestTypeEvidence = (type: PhpParameterTypeAst): PhpParameterTypeEvidence => {
        switch (type.kind) {
            case 'primitive': return Object.freeze({ kind: 'primitive', name: type.name });
            case 'named': return Object.freeze({ kind: 'named', name: type.name });
            case 'nullable': return Object.freeze({ kind: 'nullable', inner: requestTypeEvidence(type.inner) });
        }
    };
    const evidence: LaravelControllerRequestBindingEvidence = Object.freeze({
        kind: 'controller_method_parameters',
        parameters: Object.freeze(method.parameters.map(parameter => {
            switch (parameter.semantic.kind) {
                case 'request_origin':
                    return Object.freeze({
                        kind: 'request_origin' as const,
                        requestType: createRequestName(parameter.semantic.name.value.value),
                        declaredType: requestTypeEvidence(parameter.type),
                    });
                case 'model_origin':
                case 'external':
                case 'expression':
                    return Object.freeze({ kind: 'non_request_parameter' as const });
            }
        })),
        formRequests: Object.freeze(formRequestIndex.map(([name, source]) => Object.freeze({
            requestType: createRequestName(name),
            source,
        }))),
    });
    return evidence;
}

/** Compatibility path for legacy callers; the production authority wiring consumes evidence directly. */
function controllerRequestBindingJudgmentFromMethodImplementation(
    method: ControllerMethodAst,
    formRequestIndex: FormRequestSourceIndex,
): LaravelControllerRequestSemanticBinding {
    return laravelControllerRequestSemanticBindingAuthority.judge(
        controllerRequestBindingEvidenceFromMethodImplementation(method, formRequestIndex),
    );
}

/**
 * The resolver receives completed upstream judgments and performs projection only.
 * Semantic authorities close these products before invoking this boundary.
 */
export interface ControllerActionContractResolverContext {
    readonly requestBindingJudgment: RequestBindingJudgment;
    /** Canonical upstream dataflow judgment; semantic variables are never re-derived from body AST. */
    readonly dataflowJudgment: ControllerDataflowSemanticJudgment<ControllerDataflowDefinitionPayloadMetadata>;
    readonly bodyJudgment: ControllerBodySemanticJudgment<SourceFile>;
    readonly responseReferenceJudgment: ControllerResponseReferenceJudgment;
    readonly semanticReturn: import('../../../../../types/upstream/controller').ControllerReturnSemantic;
    readonly resourceBindings: readonly ControllerActionResourceBinding[];
    readonly schemaSemanticJudgment: ControllerActionSchemaSemanticJudgment<SourceFile>;
    readonly dependencies: readonly ControllerDependency[];
    readonly runtimeReturn: ControllerRuntimeReturn;
}

function resolveControllerActionContractImplementation(
    method: ControllerMethodAst,
    controllerName: ControllerName,
    sourceFile: SourceFile,
    context: ControllerActionContractResolverContext
): ControllerActionContract {
    const body: ControllerActionBodyEvidenceProjection = Object.freeze({
        statements: Object.freeze([...method.body.statements]),
        dataflow: method.body.dataflow,
    });
    const dataflow: ControllerActionDataflowContract = Object.freeze({
        semantic: context.dataflowJudgment.semanticVariables,
        resourceBindings: context.resourceBindings,
    });
    const routeRequestSchemaEvidence = context.schemaSemanticJudgment.forRouteRequest();
    return Object.freeze({
        identity: Object.freeze({ controllerName, actionName: createActionName(method.name) }),
        parameters: Object.freeze([...method.parameters]),
        request: context.requestBindingJudgment,
        responseReferenceJudgment: context.responseReferenceJudgment,
        dependencies: context.dependencies,
        runtimeReturn: context.runtimeReturn,
        semanticReturn: context.semanticReturn,
        body,
        bodySemanticJudgment: context.bodyJudgment,
        schemaSemanticJudgment: context.schemaSemanticJudgment,
        dataflow,
        dataflowJudgment: context.dataflowJudgment,
        schema: routeRequestSchemaEvidence.schema,
        schemaEvidence: routeRequestSchemaEvidence,
        sourceFile,
        sourceLine: method.source.line,
    });
}

function schemaRequestEvidenceImplementation(request: RequestContract): ControllerActionSchemaRequestEvidence {
    switch (request.kind) {
        case 'form_request': return Object.freeze({ kind: 'form_request_schema_evidence', source: request.source });
        case 'no_request': return Object.freeze({ kind: 'no_form_request_schema_evidence' });
        case 'framework_request': return Object.freeze({ kind: 'no_form_request_schema_evidence' });
        case 'typed': return Object.freeze({ kind: 'no_form_request_schema_evidence' });
        case 'typed_unresolved': return Object.freeze({ kind: 'no_form_request_schema_evidence' });
    }
}




/** Public API for controller action-contract projection. The implementation remains internal. */
export interface ControllerActionContractOperationsInterface {
    readonly controllerRequestBindingEvidenceFromMethod: (
        method: ControllerMethodAst,
        formRequestIndex: FormRequestSourceIndex,
    ) => LaravelControllerRequestBindingEvidence;
    readonly controllerRequestBindingJudgmentFromMethod: (
        method: ControllerMethodAst,
        formRequestIndex: FormRequestSourceIndex,
    ) => LaravelControllerRequestSemanticBinding;
    readonly resolveControllerActionContract: (
        method: ControllerMethodAst,
        controllerName: ControllerName,
        sourceFile: SourceFile,
        context: ControllerActionContractResolverContext,
    ) => ControllerActionContract;
    readonly schemaRequestEvidence: (
        request: RequestContract,
    ) => ControllerActionSchemaRequestEvidence;
}

export const controllerActionContractOperations: ControllerActionContractOperationsInterface = Object.freeze({
    controllerRequestBindingEvidenceFromMethod: controllerRequestBindingEvidenceFromMethodImplementation,
    controllerRequestBindingJudgmentFromMethod: controllerRequestBindingJudgmentFromMethodImplementation,
    resolveControllerActionContract: resolveControllerActionContractImplementation,
    schemaRequestEvidence: schemaRequestEvidenceImplementation,
});
