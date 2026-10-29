import { phpClassNameResolutionAuthority } from './phpClassNameResolutionAuthority';
import { laravelControllerResponseDtoDeclarationResolutionAuthority } from './laravelControllerResponseDtoDeclarationResolutionAuthority';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { PhpClassNameResolution } from './phpClassNameResolutionInterface';
import type { LaravelControllerResponseDtoDeclarationResolutionJudgment } from './laravelControllerResponseDtoDeclarationInterface';
import type {
  LaravelDtoTypeReferenceBindingAuthorityInterface,
  LaravelDtoTypeReferenceBindingAuthorityFactoryInterface,
  LaravelDtoTypeReferenceBindingAuthorityDependenciesInterface,
  LaravelDtoTypeReferenceBindingContract,
  LaravelDtoTypeReferenceBindingInput,
  LaravelDtoTypeReferenceBindingJudgment,
  LaravelDtoTypeReferenceBindingRuntimeExecutorInterface,
} from './laravelDtoTypeReferenceBindingInterface';

export const LARAVEL_DTO_TYPE_REFERENCE_BINDING_CONTRACT: LaravelDtoTypeReferenceBindingContract = Object.freeze({
  kind: 'laravel_dto_type_reference_binding_contract',
  version: 2,
  lexicalResolutionOwner: 'PhpClassNameResolutionRuleInterface',
  declarationResolutionOwner: 'LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface',
  positiveBindingRule: 'both-lexical-class-name-resolution-and-exactly-one-canonical-project-declaration-must-resolve',
  projectRule: 'source-project-and-inventory-project-must-match-under-the-existing-source-identity-semantics',
  ambiguityRule: 'multiple-canonical-declarations-remain-an-ambiguous-judgment',
  noShortNameFallback: 'unqualified-short-name-is-never-promoted-to-a-canonical-type-identity-without-lexical-resolution',
  noPromotion: 'a-bound-type-reference-is-not-by-itself-a-response-value-contract-or-response-contract',
  provenanceRule: 'the-property-type-source-span-is-retained-on-every-judgment',
  runtimeRule: 'runtime-executor-delegates-to-this-binding-authority-without-reclassification',
});

const unresolved = <Project extends SourceProjectIdentity>(
  input: LaravelDtoTypeReferenceBindingInput<Project>,
  classNameResolution: PhpClassNameResolution,
  declarationJudgment: LaravelControllerResponseDtoDeclarationResolutionJudgment<Project> | Readonly<{ readonly kind: 'not_attempted'; readonly reason: 'class_name_resolution_blocked' }>,
  reason: Extract<LaravelDtoTypeReferenceBindingJudgment<Project>, { readonly kind: 'laravel_dto_type_reference_unresolved' }>['reason'],
): LaravelDtoTypeReferenceBindingJudgment<Project> => Object.freeze({
  kind: 'laravel_dto_type_reference_unresolved',
  input,
  classNameResolution,
  declarationJudgment,
  reason,
});

const createLaravelDtoTypeReferenceBindingAuthorityImplementation = <Project extends SourceProjectIdentity = SourceProjectIdentity>(
  dependencies: LaravelDtoTypeReferenceBindingAuthorityDependenciesInterface<Project>,
): LaravelDtoTypeReferenceBindingAuthorityInterface<Project> => Object.freeze({
  kind: 'laravel_dto_type_reference_binding_authority',
  contract: LARAVEL_DTO_TYPE_REFERENCE_BINDING_CONTRACT,
  dependencies,
  bind: input => {
    const classNameResolution = dependencies.classNameResolutionAuthority.judge(Object.freeze({
      kind: 'php_class_name_resolution_input',
      sourceName: input.sourceName,
      context: input.lexicalContext,
    }));
    switch (classNameResolution.kind) {
      case 'php_class_name_resolution_blocked':
        return unresolved(
          input,
          classNameResolution,
          Object.freeze({ kind: 'not_attempted', reason: 'class_name_resolution_blocked' }),
          'class_name_resolution_blocked',
        );
      case 'php_class_name_resolved': {
        const declarationJudgment = dependencies.declarationResolutionAuthority.resolve(Object.freeze({
          kind: 'laravel_controller_response_dto_declaration_resolution_input',
          sourceProject: input.sourceProject,
          inventory: input.inventory,
          requestedClassResolution: classNameResolution,
          requestSource: input.source,
          owner: Object.freeze({ kind: 'dto_property_type_reference_owner', propertySource: input.source }),
        }));
        switch (declarationJudgment.kind) {
          case 'response_dto_declaration_resolved':
            return Object.freeze({
              kind: 'laravel_dto_type_reference_bound',
              input,
              classNameResolution,
              declarationJudgment,
            });
          case 'response_dto_declaration_unresolved':
            return unresolved(input, classNameResolution, declarationJudgment, 'declaration_unresolved');
          case 'response_dto_declaration_ambiguous':
            return unresolved(input, classNameResolution, declarationJudgment, 'declaration_ambiguous');
        }
      }
    }
  },
});

export const laravelDtoTypeReferenceBindingAuthorityFactory: LaravelDtoTypeReferenceBindingAuthorityFactoryInterface = Object.freeze({
  kind: 'laravel_dto_type_reference_binding_authority_factory',
  create: createLaravelDtoTypeReferenceBindingAuthorityImplementation,
});

export const laravelDtoTypeReferenceBindingAuthority: LaravelDtoTypeReferenceBindingAuthorityInterface = laravelDtoTypeReferenceBindingAuthorityFactory.create(
  Object.freeze({
    classNameResolutionAuthority: phpClassNameResolutionAuthority,
    declarationResolutionAuthority: laravelControllerResponseDtoDeclarationResolutionAuthority,
  }),
);

export const laravelDtoTypeReferenceBindingRuntimeExecutor: LaravelDtoTypeReferenceBindingRuntimeExecutorInterface = Object.freeze({
  kind: 'laravel_dto_type_reference_binding_runtime_executor',
  closed: true,
  contractVersion: 2,
  authority: laravelDtoTypeReferenceBindingAuthority,
  contract: LARAVEL_DTO_TYPE_REFERENCE_BINDING_CONTRACT,
  execute: laravelDtoTypeReferenceBindingAuthority.bind,
  executionRule: 'delegate-to-the-bound-authority-and-return-its-exact-judgment',
});
