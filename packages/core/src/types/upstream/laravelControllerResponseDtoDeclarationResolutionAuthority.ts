import { laravelSourceIdentitySemantics } from './sourceProjectIdentity';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type {
  LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface,
  LaravelControllerResponseDtoDeclarationResolutionContract,
  LaravelControllerResponseDtoDeclarationResolutionInput,
  LaravelControllerResponseDtoDeclarationResolutionJudgment,
  LaravelControllerResponseDtoDeclarationResolvedInput,
  LaravelControllerResponseDtoDeclarationResolutionRuntimeExecutorInterface,
  LaravelControllerResponseDtoDeclarationResolutionAuthorityDependenciesInterface,
  LaravelDtoDeclarationResolvedSourceEvidence,
} from './laravelControllerResponseDtoDeclarationInterface';

export const LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT: LaravelControllerResponseDtoDeclarationResolutionContract = Object.freeze({
  kind: 'laravel_controller_response_dto_declaration_resolution_contract',
  version: 5,
  projectBinding: 'inventory-and-receipt-must-retain-the-request-project-identity',
  scopeRule: 'inventory-proves-discovery-only-within-its-declared-scope',
  nameResolutionOwner: 'PhpClassNameResolutionRuleInterface',
  identityRule: 'match-only-canonical-php-qualified-class-identities-issued-by-the-existing-class-name-resolution-authority',
  noFallbackRule: 'short-class-name-and-file-name-matching-cannot-substitute-for-qualified-class-identity',
  cardinality: 'exactly-one-declaration-is-required',
  unresolvedRule: 'missing-or-incomplete-inventory-or-unresolved-class-identity-remains-an-explicit-blocker',
  ambiguityRule: 'multiple-matches-remain-a-distinct-ambiguous-outcome',
  evidenceRule: 'resolved-declaration-retains-exact-DTO-AST-source-identity-qualified-class-identity-and-the-same-project-provenance-as-its-inventory',
  noPromotion: 'declaration-resolution-does-not-itself-claim-a-ResponseContract-or-response-semantic-product',
  integratedResponseRule: 'the-existing-integrated-response-authority-consumes-this-judgment-without-duplicating-invocation-semantic-ownership',
  runtimeRule: 'the-runtime-executor-delegates-to-this-authority-and-forwards-its-closed-judgment-without-reclassification',
});

const unresolved = <Project extends SourceProjectIdentity>(
  request: LaravelControllerResponseDtoDeclarationResolutionInput<Project>,
  reason: Extract<LaravelControllerResponseDtoDeclarationResolutionJudgment<Project>, { readonly kind: 'response_dto_declaration_unresolved' }>['reason'],
): LaravelControllerResponseDtoDeclarationResolutionJudgment<Project> => Object.freeze({
  kind: 'response_dto_declaration_unresolved',
  request,
  matchingDeclarations: Object.freeze([]),
  reason,
});

export const createLaravelControllerResponseDtoDeclarationResolutionAuthority = (
  dependencies: LaravelControllerResponseDtoDeclarationResolutionAuthorityDependenciesInterface,
): LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface => Object.freeze({
  kind: 'laravel_controller_response_dto_declaration_resolution_authority',
  contract: LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT,
  dependencies,
  resolve: input => {
    const projectRelation = dependencies.sourceIdentitySemantics.relateSourceProjects(input.sourceProject, input.inventory.sourceProject);
    switch (projectRelation.kind) {
      case 'different_source_project_identity':
        return unresolved(input, 'project_identity_mismatch');
      case 'same_source_project_identity':
        switch (input.inventory.kind) {
          case 'laravel_project_dto_declaration_inventory_incomplete':
            return unresolved(input, 'inventory_incomplete');
          case 'laravel_project_dto_declaration_inventory_complete':
            switch (input.requestedClassResolution.kind) {
              case 'php_class_name_resolution_blocked':
                return unresolved(input, 'requested_class_name_unresolved');
              case 'php_class_name_resolved': {
                const request: LaravelControllerResponseDtoDeclarationResolvedInput = Object.freeze({
                  kind: input.kind,
                  sourceProject: input.sourceProject,
                  inventory: input.inventory,
                  requestedClassResolution: input.requestedClassResolution,
                  requestSource: input.requestSource,
                  owner: input.owner,
                });
                const unresolvedDeclarations = input.inventory.receipt.declarations.filter(
                  evidence => evidence.classIdentity.kind === 'dto_class_identity_unresolved',
                );
                const resolvedDeclarations = input.inventory.receipt.declarations.filter(
                  (evidence): evidence is LaravelDtoDeclarationResolvedSourceEvidence => evidence.classIdentity.kind === 'dto_class_identity_resolved',
                );
                const matchingDeclarations = resolvedDeclarations.filter(
                  evidence => evidence.classIdentity.resolution.qualifiedName.value.value === input.requestedClassResolution.qualifiedName.value.value,
                );
                const [firstMatch, secondMatch, ...remainingMatches] = matchingDeclarations;
                switch (firstMatch) {
                  case undefined:
                    switch (unresolvedDeclarations.length === 0) {
                      case true:
                        return unresolved(request, 'declaration_not_found');
                      case false:
                        return unresolved(request, 'declaration_class_identity_unresolved');
                    }
                  default:
                    switch (secondMatch) {
                      case undefined: {
                        const singletonMatch: readonly [LaravelDtoDeclarationResolvedSourceEvidence] = [firstMatch];
                        switch (unresolvedDeclarations.length === 0) {
                          case true:
                            return Object.freeze({
                              kind: 'response_dto_declaration_resolved',
                              request,
                              identity: Object.freeze({
                                kind: 'laravel_controller_response_dto_declaration_identity',
                                sourceProject: input.sourceProject,
                                className: input.requestedClassResolution.qualifiedName,
                                sourceFile: firstMatch.sourceFile,
                              }),
                              declaration: firstMatch,
                              matchingDeclarations: Object.freeze(singletonMatch),
                            });
                          case false:
                            return unresolved(request, 'declaration_class_identity_unresolved');
                        }
                      }
                      default: {
                        const ambiguousMatches: readonly [
                          LaravelDtoDeclarationResolvedSourceEvidence,
                          LaravelDtoDeclarationResolvedSourceEvidence,
                          ...LaravelDtoDeclarationResolvedSourceEvidence[],
                        ] = [firstMatch, secondMatch, ...remainingMatches];
                        return Object.freeze({
                          kind: 'response_dto_declaration_ambiguous',
                          request,
                          matchingDeclarations: Object.freeze(ambiguousMatches),
                          reason: 'multiple_declarations_match_requested_qualified_class',
                        });
                      }
                    }
                }
              }
            }
        }
    }
  },
});

export const laravelControllerResponseDtoDeclarationResolutionAuthority = createLaravelControllerResponseDtoDeclarationResolutionAuthority(
  Object.freeze({ sourceIdentitySemantics: laravelSourceIdentitySemantics }),
);

export const laravelControllerResponseDtoDeclarationResolutionRuntimeExecutor: LaravelControllerResponseDtoDeclarationResolutionRuntimeExecutorInterface = Object.freeze({
  kind: 'laravel_controller_response_dto_declaration_resolution_runtime_executor' as const,
  closed: true as const,
  contractVersion: 1 as const,
  authority: laravelControllerResponseDtoDeclarationResolutionAuthority,
  contract: LARAVEL_CONTROLLER_RESPONSE_DTO_DECLARATION_RESOLUTION_CONTRACT,
  execute: laravelControllerResponseDtoDeclarationResolutionAuthority.resolve,
  executionRule: 'delegate-to-the-bound-authority-and-return-its-exact-judgment' as const,
});
