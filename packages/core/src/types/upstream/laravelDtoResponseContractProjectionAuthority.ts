import { createResponseTypeName } from './names';
import { createResponseFieldName } from '../domain/semanticValueFactories';
import type { ResponseContract, ResponseContractField, ResponseNullability } from '../domain/responseContracts';
import type {
  LaravelDtoResponseShapeEvidence,
  LaravelDtoResponseContractProjectionContract,
  LaravelDtoResponseContractProjectionInput,
  LaravelDtoResponseContractProjectionAuthorityInterface,
  LaravelDtoResponseContractProjectionJudgment,
  LaravelDtoResponseContractProjectionRuntimeExecutorInterface,
} from './laravelDtoResponseContractProjectionInterface';
import { laravelDtoResponseValueProjectionAuthority } from './laravelDtoResponseValueProjectionAuthority';
import type { LaravelDtoResponseValueProjectionAuthorityInterface } from './laravelDtoResponseValueProjectionInterface';
import type { LaravelDtoPropertyTypeReferenceBindingEvidence } from './laravelDtoTypeReferenceBindingInterface';
import type { DtoProperty } from './application';
import type { LaravelDtoDeclarationResolvedSourceEvidence } from './laravelControllerResponseDtoDeclarationInterface';
import type { SourceSpan } from './provenance';

export const LARAVEL_DTO_RESPONSE_CONTRACT_PROJECTION_CONTRACT: LaravelDtoResponseContractProjectionContract = Object.freeze({
  kind: 'laravel_dto_response_contract_projection_contract',
  contractVersion: 3,
  inputRule: 'only-a-resolved-project-correlated-dto-declaration-judgment-may-enter-projection',
  identityRule: 'response-type-identity-is-derived-from-the-canonical-qualified-class-identity-in-the-declaration-judgment',
  fieldRule: 'every-public-dto-property-produces-one-ResponseContractField-with-source-provenance;the-domain-field-shape-is-reused-without-redeclaring-name-value-or-nullability',
  typeRule: 'only-type-expressions-with-an-explicit-response-value-contract-mapping-are-admitted',
  closureRule: 'one-unresolved-public-field-blocks-the-whole-response-contract-instead-of-being-dropped-or-guessed',
  shapeRule: 'response-shape-is-forwarded-from-the-controller-response-attribute-evidence-without-reclassification',
  provenanceRule: 'the-result-retains-the-exact-resolved-declaration-and-per-field-source-provenance;each-projection-field-is-the-same-domain-field-shape-used-by-ResponseContract',
  noPromotionRule: 'dto-declaration-resolution-alone-does-not-prove-a-response-contract;this-projection-judgment-must-succeed',
  integrationOwner: 'LaravelControllerResponseSemanticPipelineInterface',
  runtimeRule: 'runtime-executor-only-forwards-the-closed-projection-judgment-and-does-not-infer-field-semantics',
});

const sequenceToArray = <T>(items: import('../../semantic/relations/relationalSequence').Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

const fieldBindingFor = (
  declaration: LaravelDtoDeclarationResolvedSourceEvidence,
  property: DtoProperty,
  bindings: readonly LaravelDtoPropertyTypeReferenceBindingEvidence[],
): LaravelDtoPropertyTypeReferenceBindingEvidence | undefined => bindings.find(
  binding => binding.ownerDeclaration === declaration && binding.property === property,
);

const nullabilityFor = (property: DtoProperty): ResponseNullability => {
  switch (property.declared.nullability.kind) {
    case 'nullable':
      return Object.freeze({ kind: 'nullable' });
    case 'non_nullable':
      return Object.freeze({ kind: 'required' });
  }
};

const sourceFor = (property: DtoProperty): SourceSpan => property.typeEvidence.source;

const projectField = (
  declaration: LaravelDtoDeclarationResolvedSourceEvidence,
  property: DtoProperty,
  input: LaravelDtoResponseContractProjectionInput,
  valueProjectionAuthority: LaravelDtoResponseValueProjectionAuthorityInterface,
): Readonly<{ readonly kind: 'field_resolved'; readonly field: ResponseContractField; readonly source: SourceSpan }> | Readonly<{ readonly kind: 'field_unresolved'; readonly reason: Extract<LaravelDtoResponseContractProjectionJudgment, { readonly kind: 'laravel_dto_response_contract_projection_unresolved' }>['reason']; readonly source: SourceSpan }> => {
  switch (property.property.name.value.value.length > 0) {
    case false:
      return Object.freeze({ kind: 'field_unresolved', reason: 'dto-field-name-not-canonical', source: sourceFor(property) });
    case true:
      switch (property.property.presence.kind) {
        case 'optional':
        case 'unspecified':
          return Object.freeze({ kind: 'field_unresolved', reason: 'dto-field-presence-semantics-not-closed', source: sourceFor(property) });
        case 'required': {
          const bindingEvidence = fieldBindingFor(declaration, property, input.propertyTypeReferenceBindings);
          const referenceBinding = bindingEvidence === undefined
            ? Object.freeze({ kind: 'response_value_reference_binding_not_required' as const })
            : Object.freeze({ kind: 'response_value_reference_binding_required' as const, judgment: bindingEvidence.judgment });
          const valueJudgment = valueProjectionAuthority.project(Object.freeze({
            kind: 'laravel_dto_response_value_projection_input',
            expression: property.declared.value,
            source: sourceFor(property),
            referenceBinding,
          }));
          switch (valueJudgment.kind) {
            case 'laravel_dto_response_value_projection_unresolved':
              return Object.freeze({ kind: 'field_unresolved', reason: 'dto-field-type-not-representable-in-response-contract', source: sourceFor(property) });
            case 'laravel_dto_response_value_projection_resolved': {
              const field: ResponseContractField = Object.freeze({
                name: createResponseFieldName(property.property.name.value.value),
                value: valueJudgment.value,
                nullability: nullabilityFor(property),
                evidence: Object.freeze({ kind: 'declared' }),
              });
              return Object.freeze({ kind: 'field_resolved', field, source: sourceFor(property) });
            }
          }
        }
      }
  }
};

export const createLaravelDtoResponseContractProjectionAuthority = (
  valueProjectionAuthority: LaravelDtoResponseValueProjectionAuthorityInterface,
): LaravelDtoResponseContractProjectionAuthorityInterface => Object.freeze({
  authorityRole: 'semantic_judgment_owner',
  kind: 'laravel_dto_response_contract_projection',
  contract: LARAVEL_DTO_RESPONSE_CONTRACT_PROJECTION_CONTRACT,
  project: (input: LaravelDtoResponseContractProjectionInput): LaravelDtoResponseContractProjectionJudgment => {
    switch (input.responseShapeEvidence.kind) {
      case 'laravel_dto_response_shape_unavailable':
        return Object.freeze({ kind: 'laravel_dto_response_contract_projection_unresolved', input, reason: 'response-shape-evidence-unavailable', source: input.declarationJudgment.request.requestSource });
      case 'laravel_dto_response_shape_available':
        return projectWithShape(input, input.responseShapeEvidence.shape, valueProjectionAuthority);
    }
  },
});

/** Default composition binding; the authority's dependency remains typed by its upstream interface. */
export const laravelDtoResponseContractProjectionAuthority = createLaravelDtoResponseContractProjectionAuthority(
  laravelDtoResponseValueProjectionAuthority,
);

function projectWithShape(
  input: LaravelDtoResponseContractProjectionInput,
  responseShape: import('../domain/responseShapes').ResponseShape,
  valueProjectionAuthority: LaravelDtoResponseValueProjectionAuthorityInterface,
): LaravelDtoResponseContractProjectionJudgment {
  const declaration = input.declarationJudgment.declaration;
  const properties = sequenceToArray(declaration.declaration.semantic.properties.items);
  const projections = properties.map(property => projectField(declaration, property, input, valueProjectionAuthority));
  const unresolved = projections.find(projection => projection.kind === 'field_unresolved');
  switch (unresolved?.kind) {
    case 'field_unresolved':
      return Object.freeze({
        kind: 'laravel_dto_response_contract_projection_unresolved',
        input,
        reason: unresolved.reason,
        source: unresolved.source,
      });
    case undefined: {
      const fieldProjections = projections.flatMap(projection => projection.kind === 'field_resolved'
        ? [Object.freeze({ kind: 'laravel_dto_response_contract_field_projection' as const, field: projection.field, source: projection.source })]
        : []);
      const responseContract: ResponseContract = Object.freeze({
        kind: 'object',
        name: createResponseTypeName(input.declarationJudgment.identity.className.value.value),
        shape: responseShape,
        fields: Object.freeze(fieldProjections.map(projection => projection.field)),
      });
      return Object.freeze({
        kind: 'laravel_dto_response_contract_projection_resolved',
        input,
        responseContract,
        fieldProjections: Object.freeze(fieldProjections),
        declarationSource: declaration.declaration.source,
      });
    }
  }
}

export const laravelDtoResponseContractProjectionRuntimeExecutor: LaravelDtoResponseContractProjectionRuntimeExecutorInterface = Object.freeze({
  kind: 'laravel_dto_response_contract_projection_runtime_executor',
  closed: true,
  contractVersion: 3,
  projection: laravelDtoResponseContractProjectionAuthority,
  contract: laravelDtoResponseContractProjectionAuthority.contract,
  execute: laravelDtoResponseContractProjectionAuthority.project,
  executionRule: 'delegate-to-the-bound-projection-interface-and-return-its-exact-judgment',
});
