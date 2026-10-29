import { sourceFileAcquisition } from '../sourceFiles';
/**
 * Explicit production composition for controller execution dependencies.
 *
 * This is a migration seam, not a claim that the legacy action semantic owner
 * has been retired. The scanner consumes interfaces; this composition module
 * is the only place that binds them to current implementations.
 */
import type { ControllerProducer } from '../../../types/upstream/controllerProducerInterface';
import { controllerActionContractOperations, type ControllerActionContract } from '../operations/domain-model/request/controllerActionContract';
import type { ControllerMethodAst, ControllerParameterAst } from '../../frontend/php/controllerAstTypes';
import type { ControllerBodySemanticJudgmentAuthorityInterface } from '../../../types/upstream/controllerBodySemanticJudgmentInterface';
import type { LaravelControllerRequestSemanticBindingAuthorityInterface } from '../../../types/upstream/laravelControllerRequestSemanticBindingInterface';
import type { ControllerResourceBindingAuthorityInterface } from '../../../types/upstream/controllerResourceBindingInterface';
import type { ControllerParameterClassNameJudgmentInterface } from '../../../types/upstream/controllerParameterClassNameJudgmentInterface';
import type { ControllerReturnSemanticProductionInterface } from '../../../types/upstream/controllerReturnSemanticProductionInterface';
import type { ControllerActionSchemaSemanticJudgmentAuthorityInterface } from '../../../types/upstream/controllerActionSchemaSemanticJudgmentInterface';
import { controllerActionSchemaSemanticJudgmentAuthority } from '../../../types/upstream/controllerActionSchemaSemanticJudgmentAuthority';
import type { ControllerActionResponseReferenceJudgmentInterface } from '../../../types/upstream/controllerActionResponseReferenceJudgmentInterface';
import { controllerActionResponseReferenceJudgmentAuthority } from '../../../types/upstream/controllerActionResponseReferenceJudgmentAuthority';
import type { ControllerRuntimeReturnProjectionInterface } from '../../../types/upstream/controllerRuntimeReturnProjectionInterface';
import { controllerRuntimeReturnProjection } from '../../frontend/php/routeAst/controllerRuntimeReturnProjection';
import { controllerDependencySemanticJudgmentAuthority } from '../../../types/upstream/controllerDependencySemanticJudgmentAuthority';
import type { ControllerDependencySemanticJudgmentAuthorityInterface, ControllerDependencySemanticJudgment } from '../../../types/upstream/controllerDependencySemanticJudgmentInterface';
import type { SourceFile } from '../../../types/upstream/names';
import { controllerParameterClassNameJudgmentAuthority } from './controllerParameterClassNameJudgmentExecutor';
import { controllerActionProjectionMigration, type LaravelControllerActionContractResolverInterface, type LaravelControllerActionSemanticJudgmentInput, type LaravelControllerActionSemanticJudgmentPublication, type LaravelControllerActionSemanticJudgmentAuthorityInterface } from '../../../types/upstream/laravelControllerActionSemanticJudgmentInterface';
import { controllerProducer } from '../operations/controller/controllerProducer';
import { controllerBodySemanticJudgmentAuthority, controllerAstCanonicalOperations } from '../operations/controller/controllerAstCanonical';
import { controllerDependencyEvidenceProjection } from './controllerDependencyEvidenceProjection';
import { controllerPhpAstExpressionSemanticAuthority } from './controllerVariableSemanticRuntimeBinding';
import { laravelControllerRequestSemanticBindingAuthority } from '../../../types/upstream/laravelControllerRequestSemanticBindingAuthority';
import type { LaravelControllerRequestBindingEvidenceProjectionInterface } from '../../../types/upstream/laravelControllerRequestSemanticBindingInterface';
import type { FormRequestSourceIndex } from '../operations/domain-model/request/controllerActionContract';
import { controllerResourceBindingAuthority } from '../../../types/upstream/controllerResourceBindingAuthority';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { ControllerStaticCallClassNameResolutionContextEvidence } from '../../../types/upstream/controllerStaticCallOriginInterface';
import type { ControllerResourceBindingJudgment } from '../../../types/upstream/controllerResourceBindingInterface';
import { createActionName, createClassName } from '../../../types/upstream/names';
import type { ControllerResourceReturnSourceEvidenceProjectionInterface } from '../../../types/upstream/controllerResourceReturnSourceEvidenceProjectionInterface';
import type { PhpAstValue } from '../../frontend/php/phpAstExpressionTypes';
import type { PhpAstExpressionSemanticAuthorityInterface } from '../../../types/upstream/phpAstExpressionSemanticAuthorityInterface';
import type { SourceRange } from '../../frontend/php/phpAstTypes';
import { controllerResourceReturnSourceEvidenceProjection } from '../../frontend/php/routeAst/controllerResourceReturnSourceEvidenceProjection';



export interface LaravelControllerExecutionDependencies {
  readonly readSourceText: (path: string) => Promise<string>;
  /** Existing upstream body judgment contract; scanner wiring supplies its current implementation. */
  readonly bodySemanticJudgmentAuthority: ControllerBodySemanticJudgmentAuthorityInterface<ControllerMethodAst['body'], ControllerMethodAst, SourceFile>;
  /** AST-to-typed request evidence adapter; request semantics remain owned by the upstream request-binding authority. */
  readonly requestBindingEvidenceProjection: LaravelControllerRequestBindingEvidenceProjectionInterface<ControllerMethodAst, FormRequestSourceIndex>;
  /** Canonical return ADT production boundary; the current implementation remains a tracked legacy dependency. */
  readonly returnSemanticProduction: ControllerReturnSemanticProductionInterface<ControllerMethodAst>;
  readonly dependencySemanticJudgmentAuthority: ControllerDependencySemanticJudgmentAuthorityInterface;
  /** Existing upstream request authority; production action judgment must not capture its singleton directly. */
  readonly requestSemanticBindingAuthority: LaravelControllerRequestSemanticBindingAuthorityInterface;
  /** Sole upstream resource authority, injected for both judgment and canonical publication. */
  readonly resourceBindingAuthority: ControllerResourceBindingAuthorityInterface;
  /** Upstream class-name judgment authority used by dependency semantic derivation. */
  readonly parameterClassNameJudgmentAuthority: ControllerParameterClassNameJudgmentInterface;
  /** Existing upstream expression authority used to project PHP attribute argument evidence. */
  readonly phpAstExpressionSemanticAuthority: PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>;
  /** Existing upstream contract implemented by the parser adapter and injected into action derivation. */
  readonly resourceReturnSourceEvidenceProjection: ControllerResourceReturnSourceEvidenceProjectionInterface<PhpAstValue, SourceRange>;
  /** Existing upstream schema judgment authority; action derivation receives it through the composition contract. */
  readonly schemaSemanticJudgmentAuthority: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile>;
  readonly responseReferenceJudgmentAuthority: ControllerActionResponseReferenceJudgmentInterface;
  readonly runtimeReturnProjection: ControllerRuntimeReturnProjectionInterface<ControllerMethodAst>;
  /** Upstream-owned contract for action resolution; its current adapter remains legacy-backed. */
  readonly actionContractResolver: LaravelControllerActionContractResolverInterface<
    ControllerMethodAst,
    import('../../../types/upstream/names').ControllerName,
    SourceFile,
    import('../operations/domain-model/request/controllerActionContract').ControllerActionContractResolverContext,
    ControllerActionContract
  >;
  readonly actionJudgment: LaravelControllerActionSemanticJudgmentAuthorityInterface<ControllerActionContract, ControllerMethodAst, ControllerParameterAst>;
  readonly controllerProducer: ControllerProducer;
  readonly controllerAstProjection: Readonly<{
    readonly actionFromMethod: typeof controllerAstCanonicalOperations.controllerActionFromMethod;
    readonly methodContractFromMethod: typeof controllerAstCanonicalOperations.controllerMethodContractFromMethod;
    readonly methodAttributesFromAttributes: typeof controllerAstCanonicalOperations.controllerMethodAttributesFromAttributes;
    readonly methodSemanticProjectionFromMethod: typeof controllerAstCanonicalOperations.controllerMethodSemanticProjectionFromMethod;
  }> ;
}

const createActionJudgmentAuthority = (
  bodySemanticJudgmentAuthority: LaravelControllerExecutionDependencies['bodySemanticJudgmentAuthority'],
  requestBindingEvidenceProjection: LaravelControllerExecutionDependencies['requestBindingEvidenceProjection'],
  returnSemanticProduction: LaravelControllerExecutionDependencies['returnSemanticProduction'],
  dependencySemanticJudgmentAuthority: LaravelControllerExecutionDependencies['dependencySemanticJudgmentAuthority'],
  requestSemanticBindingAuthority: LaravelControllerExecutionDependencies['requestSemanticBindingAuthority'],
  resourceBindingAuthority: LaravelControllerExecutionDependencies['resourceBindingAuthority'],
  parameterClassNameJudgmentAuthority: LaravelControllerExecutionDependencies['parameterClassNameJudgmentAuthority'],
  phpAstExpressionSemanticAuthority: LaravelControllerExecutionDependencies['phpAstExpressionSemanticAuthority'],
  resourceReturnSourceEvidenceProjection: LaravelControllerExecutionDependencies['resourceReturnSourceEvidenceProjection'],
  schemaSemanticJudgmentAuthority: LaravelControllerExecutionDependencies['schemaSemanticJudgmentAuthority'],
  responseReferenceJudgmentAuthority: LaravelControllerExecutionDependencies['responseReferenceJudgmentAuthority'],
  runtimeReturnProjection: LaravelControllerExecutionDependencies['runtimeReturnProjection'],
  actionContractResolver: LaravelControllerActionContractResolverInterface<
    ControllerMethodAst,
    import('../../../types/upstream/names').ControllerName,
    SourceFile,
    import('../operations/domain-model/request/controllerActionContract').ControllerActionContractResolverContext,
    ControllerActionContract
  >,
): LaravelControllerActionSemanticJudgmentAuthorityInterface<ControllerActionContract, ControllerMethodAst, ControllerParameterAst> => Object.freeze({
    kind: 'laravel_controller_action_semantic_judgment_authority' as const,
    contract: Object.freeze({
      kind: 'laravel_controller_action_semantic_judgment_contract' as const,
      version: 50 as const,
      judgmentShape: 'canonical-semantic-judgment-retains-the-exact-closed-dataflow-judgment;consumer-projection-is-a-sibling-publication-product;projection-migration-debt-is-contract-level-not-judgment-level;upstream-authority-ownership-debt-is-explicit-and-does-not-claim-interface-use-equals-semantic-migration' as const,
      projectionMigration: controllerActionProjectionMigration,
      invocationCorrelation: 'completed-action-judgment-retains-the-exact-invocation-judgment-value' as const,
      methodSourceCorrelation: 'canonical-action-judgment-retains-the-exact-method-source-span-and-correlates-it-to-the-invocation-source-file' as const,
      controllerIdentityCorrelation: 'canonical-action-judgment-retains-the-controller-identity-from-the-semantic-input-and-route-publication-must-correlate-against-it' as const,
      responseOwnership: 'declared-controller-response-reference-judgment-is-derived-from-exact-method-attribute-source-evidence-and-is-not-an-http-return-judgment-or-a-legacy-descriptor-derived-fact' as const,
      integratedResponseOwnership: 'controller-wide-integrated-response-remains-owned-by-LaravelControllerResponseSemanticPipelineInterface-and-is-not-flattened-into-per-action-response' as const,
      responseProductCorrelationRule: 'controller-artifact-publishes-only-source-correlated-canonical-method-response-products-from-LaravelControllerResponseSemanticPipelineInterface;action-contract-does-not-derive-or-store-a-parallel-response-descriptor' as const,
      derivationBoundary: 'dependency-resolution-is-owned-by-controllerDependencySemanticJudgmentAuthorityInterface-from-typed-parameter-origin-class-name-and-contextual-attribute-evidence;body-and-request-evidence-adapters-are-consumed-through-the-existing-typed-dependency-contract;canonical-action-judgment-fields-are-composed-directly-from-existing-upstream-judgments-and-the-exact-method-evidence;LaravelControllerActionContractResolverInterface-is-used-only-to-produce-the-sibling-compiler-consumer-projection-and-does-not-supply-canonical-judgment-fields;canonical-return-semantic-production-is-consumed-through-an-upstream-typed-contract-but-its-current-adapter-still-delegates-to-controllerAstCanonical-and-is-not-claimed-retired;body-semantic-judgment-is-produced-before-legacy-action-projection-by-the-existing-controller-body-authority;canonical-response-reference-judgment-is-derived-from-exact-method-attribute-source-evidence;response-descriptor-derivation-is-retired-from-action-contract-and-canonical-response-products-are-owned-by-LaravelControllerResponseSemanticPipelineInterface;request-kind-and-php-type-resolution-are-owned-by-the-upstream-request-binding-authority;resource-binding-judgment-and-canonical-domain-publication-are-both-owned-by-controllerResourceBindingAuthority;controllerDataflowSemanticJudgmentAuthority-direct-correspondence-identity-and-variable-flow-authorities-no-longer-import-semantic-relations-directly;transitive-semantic-relations-remain-in-semanticDataflowKnowledge-and-upstream-collection-vocabulary' as const,
      projectionSemanticLeakage: 'body-source-ast-remains-in-the-consumer-projection;body-semantic-statements-and-error-responses-are-published-as-upstream-domain-knowledge;schema-is-published-by-a-source-correlated-schema-judgment-with-explicit-derivation-origin;canonical-variable-flow-is-published-from-the-closed-controller-dataflow-judgment;canonical-action-request-judgment-is-derived-once-from-source-parameter-evidence-by-the-injected-LaravelControllerRequestSemanticBindingAuthorityInterface-and-forwarded-into-the-legacy-projection;schema-request-evidence-is-projected-from-the-canonical-request-judgment;resource-binding-judgment-and-domain-publication-are-both-owned-by-the-injected-ControllerResourceBindingAuthorityInterface;legacy-action-contract-remains-a-sibling-consumer-projection-and-is-not-read-back-to-construct-semantic-judgment' as const,
      authoritySequence: 'source-evidence-is-closed-by-existing-upstream-contracts-before-judgment-publication;consumer-projection-is-produced-as-a-sibling-and-never-populates-canonical-semantic-knowledge' as const,
      runtimeOwnership: 'runtime-executor-forwards-the-completed-judgment-without-semantic-reclassification' as const,
    }),
    sourceCorrelation: 'action-judgment-retains-the-exact-invocation-judgment-and-source-identity-supplied-as-input' as const,
    judge: <TInvocationJudgment extends import('../../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface').LaravelControllerInvocationSemanticJudgmentInterface>(input: LaravelControllerActionSemanticJudgmentInput<ControllerMethodAst, ControllerParameterAst, TInvocationJudgment>): LaravelControllerActionSemanticJudgmentPublication<ControllerActionContract, TInvocationJudgment> => {
      const requestBindingEvidence = requestBindingEvidenceProjection.project(Object.freeze({ method: input.method, formRequestIndex: input.formRequestIndex }));
      const requestBindingJudgment = requestSemanticBindingAuthority.judge(requestBindingEvidence);
      const bodyJudgment = bodySemanticJudgmentAuthority.judge({ body: input.method.body, method: input.method, sourceIdentity: input.invocationJudgment.sourceFile });
      const sourceFile = input.invocationJudgment.sourceFile;
      const responseReferenceJudgment = responseReferenceJudgmentAuthority.judge(input.method.responseAttribute.kind === 'absent'
        ? Object.freeze({ kind: 'absent' })
        : Object.freeze({ kind: 'declared', className: createClassName(input.method.responseAttribute.className) }));
      const semanticReturn = returnSemanticProduction.produce(Object.freeze({
        method: input.method,
        sourceFile,
        responseReferenceJudgment,
      }));
      const returnedExpressions = Object.freeze(input.method.returns.map(item => Object.freeze({
        kind: 'controller_resource_return_expression_evidence' as const,
        expression: item.expression,
        source: item.expression.source,
      })));
      const classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence = input.method.classNameResolutionContext === undefined
        ? Object.freeze({ kind: 'unavailable', reason: 'controller_method_lexical_context_missing' })
        : Object.freeze({ kind: 'available', context: input.method.classNameResolutionContext });
      const resourceEvidence = resourceReturnSourceEvidenceProjection.project({
        kind: 'controller_resource_return_source_evidence_projection_input',
        returnedExpressions,
        semanticVariables: input.method.body.dataflow.semanticVariables,
        response: responseReferenceJudgment,
        modelClasses: input.modelClasses,
        classNameResolutionContextEvidence,
      });
      const resourceBindings = Object.freeze(resourceEvidence.flatMap(evidence => {
        const judgment: ControllerResourceBindingJudgment = resourceBindingAuthority.judge(evidence.candidate);
        switch (judgment.kind) {
          case 'resolved': return [Object.freeze({
            resourceName: judgment.resourceName,
            model: judgment.model,
            response: judgment.response,
            source: evidence.source,
          })];
          case 'unresolved':
          case 'not_applicable': return [];
        }
      }));
      const schemaSemanticJudgment = schemaSemanticJudgmentAuthority.judge(Object.freeze({
        requestEvidence: controllerActionContractOperations.schemaRequestEvidence(requestBindingJudgment),
        inlineSchema: bodyJudgment.schema,
        inlineSchemaEvidence: bodyJudgment.inlineSchemaEvidence,
        inlineValidationEntries: bodyJudgment.validationEntries,
        sourceIdentity: sourceFile,
      }));
      const dependencyEvidence = controllerDependencyEvidenceProjection.project(Object.freeze({
        constructorParameters: Object.freeze(input.constructorParameters.map(parameter => Object.freeze({
          parameter,
          classNameJudgment: parameterClassNameJudgmentAuthority.judge(parameter.semantic),
        }))),
        methodParameters: Object.freeze(input.method.parameters.map(parameter => Object.freeze({
          parameter,
          classNameJudgment: parameterClassNameJudgmentAuthority.judge(parameter.semantic),
        }))),
        customContextualAttributeNames: input.contextualAttributeNames,
        sourceFile,
        expressionAuthority: phpAstExpressionSemanticAuthority,
      }));
      const dependencies = Object.freeze(dependencyEvidence.flatMap(evidence =>
        controllerDependencyFromJudgment(dependencySemanticJudgmentAuthority.judge(evidence)),
      ));
      const runtimeReturn = runtimeReturnProjection.project(Object.freeze({
        kind: 'controller_runtime_return_projection_input',
        method: input.method,
        sourceFile,
      }));
      const contract = actionContractResolver.resolve(Object.freeze({
        kind: 'laravel_controller_action_contract_resolution_input',
        method: input.method,
        controller: input.controller,
        source: sourceFile,
        context: Object.freeze({
          requestBindingJudgment,
          dataflowJudgment: input.method.body.dataflow,
          bodyJudgment,
          responseReferenceJudgment,
          semanticReturn,
          resourceBindings,
          schemaSemanticJudgment,
          dependencies,
          runtimeReturn,
        }),
      }));
      return Object.freeze({
        kind: 'controller_action_semantic_judgment_publication',
        judgment: Object.freeze({
          kind: 'controller_action_semantic_judgment_published',
          invocationJudgment: input.invocationJudgment,
          semantic: Object.freeze({
          controllerName: input.controller,
          source: input.methodSource,
          actionName: createActionName(input.method.name),
          responseReferenceJudgment,
          dependencies,
          request: requestBindingJudgment,
          dataflowJudgment: input.method.body.dataflow,
          dataflow: input.method.body.dataflow.semanticVariables,
          schema: schemaSemanticJudgment.routeRequestEvidence.schema,
          schemaEvidence: schemaSemanticJudgment.routeRequestEvidence,
          bodyJudgment,
          body: Object.freeze({
            statements: bodyJudgment.statements,
            errorResponses: bodyJudgment.errorResponses,
          }),
          resourceBindings: Object.freeze(resourceBindings.map(binding => resourceBindingAuthority.publishResolved({
            resourceName: binding.resourceName,
            model: binding.model,
            response: binding.response,
            source: Object.freeze({
              kind: 'source_span',
              file: input.invocationJudgment.sourceFile,
              start: Object.freeze({ kind: 'number_value', value: binding.source.startOffset }),
              end: Object.freeze({ kind: 'number_value', value: binding.source.endOffset }),
            }) satisfies SourceSpan,
          }))),
          returns: Object.freeze({
            semantic: semanticReturn,
            runtime: runtimeReturn,
          }),
          }),
        }),
        projection: contract,
      });
    },
  });

function controllerDependencyFromJudgment(judgment: ControllerDependencySemanticJudgment): readonly import('../../../types/upstream/controller').ControllerDependency[] {
  switch (judgment.kind) {
    case 'controller_dependency_resolved': return [judgment.dependency];
    case 'controller_dependency_excluded': return [];
  }
}

const bodySemanticJudgmentAuthority = controllerBodySemanticJudgmentAuthority;
const requestBindingEvidenceProjection: LaravelControllerExecutionDependencies['requestBindingEvidenceProjection'] = Object.freeze({
  kind: 'laravel_controller_request_binding_evidence_projection',
  output: 'closed-controller-method-parameter-inventory-evidence',
  project: ({ method, formRequestIndex }) => controllerActionContractOperations.controllerRequestBindingEvidenceFromMethod(method, formRequestIndex),
});
const returnSemanticProduction: LaravelControllerExecutionDependencies['returnSemanticProduction'] = Object.freeze({
  kind: 'controller_return_semantic_production',
  ownership: 'produces-the-existing-ControllerReturnSemantic-ADT-for-the-exact-method-source-subject',
  produce: ({ method, sourceFile, responseReferenceJudgment }) => controllerAstCanonicalOperations.controllerReturnSemanticFromMethod(method, sourceFile.value.value, responseReferenceJudgment),
});
const actionContractResolver: LaravelControllerExecutionDependencies['actionContractResolver'] = Object.freeze({
  kind: 'laravel_controller_action_contract_resolver',
  ownership: 'projects-already-closed-upstream-judgments-without-semantic-derivation',
  resolve: ({ method, controller, source, context }) => controllerActionContractOperations.resolveControllerActionContract(method, controller, source, context),
});
const actionJudgmentAuthority = createActionJudgmentAuthority(
  bodySemanticJudgmentAuthority,
  requestBindingEvidenceProjection,
  returnSemanticProduction,
  controllerDependencySemanticJudgmentAuthority,
  laravelControllerRequestSemanticBindingAuthority,
  controllerResourceBindingAuthority,
  controllerParameterClassNameJudgmentAuthority,
  controllerPhpAstExpressionSemanticAuthority,
  controllerResourceReturnSourceEvidenceProjection,
  controllerActionSchemaSemanticJudgmentAuthority,
  controllerActionResponseReferenceJudgmentAuthority,
  controllerRuntimeReturnProjection,
  actionContractResolver,
);

export const legacyLaravelControllerExecutionDependencies: LaravelControllerExecutionDependencies = Object.freeze({
  readSourceText: sourceFileAcquisition.readSourceText,
  bodySemanticJudgmentAuthority,
  requestBindingEvidenceProjection,
  returnSemanticProduction,
  dependencySemanticJudgmentAuthority: controllerDependencySemanticJudgmentAuthority,
  requestSemanticBindingAuthority: laravelControllerRequestSemanticBindingAuthority,
  resourceBindingAuthority: controllerResourceBindingAuthority,
  parameterClassNameJudgmentAuthority: controllerParameterClassNameJudgmentAuthority,
  phpAstExpressionSemanticAuthority: controllerPhpAstExpressionSemanticAuthority,
  resourceReturnSourceEvidenceProjection: controllerResourceReturnSourceEvidenceProjection,
  schemaSemanticJudgmentAuthority: controllerActionSchemaSemanticJudgmentAuthority,
  responseReferenceJudgmentAuthority: controllerActionResponseReferenceJudgmentAuthority,
  runtimeReturnProjection: controllerRuntimeReturnProjection,
  actionContractResolver,
  actionJudgment: actionJudgmentAuthority,
  controllerProducer,
  controllerAstProjection: Object.freeze({
    actionFromMethod: controllerAstCanonicalOperations.controllerActionFromMethod,
    methodContractFromMethod: controllerAstCanonicalOperations.controllerMethodContractFromMethod,
    methodAttributesFromAttributes: controllerAstCanonicalOperations.controllerMethodAttributesFromAttributes,
    methodSemanticProjectionFromMethod: controllerAstCanonicalOperations.controllerMethodSemanticProjectionFromMethod,
  }),
});
