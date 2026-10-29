import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { FilesystemFailureCode, FilesystemFailureLocation } from './filesystemFailureInterface';
import type { SourceFile } from './names';
import { semanticDataflowQueryPolicySelectionFactory, type SemanticDataflowQueryPolicyIntent } from './semanticDataflowQueryPolicy';
import type { SourceSpan } from './provenance';
import type { NumberValue, StringValue } from './valueObjects';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const numberValue = (value: number): NumberValue => ({ kind: 'number_value', value });


/** Canonical project-root identity is established before discovery or inventory construction. */
export interface ControllerSourceProjectIdentityCanonicalizedJudgment {
  readonly kind: 'controller_source_project_identity_canonicalized';
  readonly requested: SourceProjectIdentity;
  readonly canonical: SourceProjectIdentity;
  readonly continueToSourceDiscoveryIdentity: () => SourceProjectIdentity;
}

/** Stable, normalized filesystem evidence carried into the CLI manifest terminal. */
export interface ControllerSourceProjectIdentityCanonicalizationBlockedEvidence {
  readonly kind: 'controller_source_project_identity_canonicalization_blocked_evidence';
  readonly requested: SourceProjectIdentity;
  readonly failureCode: FilesystemFailureCode;
  readonly location: FilesystemFailureLocation;
  readonly failureName: StringValue;
  readonly failureMessage: StringValue;
}

/** A failed canonicalization retains normalized filesystem evidence and exposes an explicit projection operation. */
export interface ControllerSourceProjectIdentityCanonicalizationBlockedJudgment {
  readonly kind: 'controller_source_project_identity_canonicalization_blocked';
  readonly requested: SourceProjectIdentity;
  readonly failureCode: FilesystemFailureCode;
  readonly location: FilesystemFailureLocation;
  readonly failureName: StringValue;
  readonly failureMessage: StringValue;
  readonly preserveFailureEvidence: () => ControllerSourceProjectIdentityCanonicalizationBlockedEvidence;
}

/** Closed outcome: each variant owns the domain operation appropriate to that outcome. */
export type ControllerSourceProjectIdentityCanonicalizationResult =
  | ControllerSourceProjectIdentityCanonicalizedJudgment
  | ControllerSourceProjectIdentityCanonicalizationBlockedJudgment;

export interface ControllerSourceProjectIdentityCanonicalizationInput {
  readonly kind: 'controller_source_project_identity_canonicalization_input';
  readonly sourceProject: SourceProjectIdentity;
}

export interface ControllerSourceProjectIdentityCanonicalizationInterface {
  readonly kind: 'controller_source_project_identity_canonicalization';
  readonly contractVersion: 2;
  readonly canonicalize: (
    input: ControllerSourceProjectIdentityCanonicalizationInput,
  ) => Promise<ControllerSourceProjectIdentityCanonicalizationResult>;
}

/** Typed identity relations are semantic judgments with domain continuation. */
export interface SourceProjectIdentityRelationHandlers<Result> {
  readonly onSame: (relation: Extract<SourceProjectIdentityRelationJudgment, { readonly kind: 'same_source_project_identity' }>) => Result;
  readonly onDifferent: (relation: Extract<SourceProjectIdentityRelationJudgment, { readonly kind: 'different_source_project_identity' }>) => Result;
}

export interface SourceProjectIdentityRelationOperations {
  readonly continueWith: <Result>(handlers: SourceProjectIdentityRelationHandlers<Result>) => Result;
}

export type SourceProjectIdentityRelationJudgment =
  | (Readonly<{
      readonly kind: 'same_source_project_identity';
      readonly identity: SourceProjectIdentity;
    }> & SourceProjectIdentityRelationOperations)
  | (Readonly<{
      readonly kind: 'different_source_project_identity';
      readonly left: SourceProjectIdentity;
      readonly right: SourceProjectIdentity;
    }> & SourceProjectIdentityRelationOperations);

export interface SourceFileIdentityRelationHandlers<Result> {
  readonly onSame: (relation: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }>) => Result;
  readonly onDifferent: (relation: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }>) => Result;
}

export interface SourceFileIdentityRelationOperations {
  readonly continueWith: <Result>(handlers: SourceFileIdentityRelationHandlers<Result>) => Result;
}

export type SourceFileIdentityRelationJudgment =
  | (Readonly<{
      readonly kind: 'same_source_file_identity';
      readonly identity: SourceFile;
    }> & SourceFileIdentityRelationOperations)
  | (Readonly<{
      readonly kind: 'different_source_file_identity';
      readonly left: SourceFile;
      readonly right: SourceFile;
    }> & SourceFileIdentityRelationOperations);

/**
 * Identity contract for source-project and source-file relation judgments.
 * Project identity is owned by SourceProjectIdentity.kind + root; `source` is
 * provenance and therefore must not change project identity. Source-file identity
 * is owned by the canonical SourceFile value. These are domain types, not a list
 * of string labels interpreted by an executor.
 */
export interface LaravelSourceIdentitySemanticsContract {
  readonly kind: 'laravel_source_identity_semantics_contract';
  readonly version: 4;
}

export interface LaravelSourceIdentitySemanticsInterface {
  readonly kind: 'laravel_source_identity_semantics';
  readonly contract: LaravelSourceIdentitySemanticsContract;
  readonly relateSourceProjects: (
    left: SourceProjectIdentity,
    right: SourceProjectIdentity,
  ) => SourceProjectIdentityRelationJudgment;
  readonly relateSourceFiles: (
    left: SourceFile,
    right: SourceFile,
  ) => SourceFileIdentityRelationJudgment;
}

export const LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT: LaravelSourceIdentitySemanticsContract = Object.freeze({
  kind: 'laravel_source_identity_semantics_contract',
  version: 4,
});

/** One canonical implementation is shared by upstream authorities; consumers do not reimplement identity comparison. */
export const laravelSourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface = Object.freeze({
  kind: 'laravel_source_identity_semantics',
  contract: LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT,
  relateSourceProjects: (left: SourceProjectIdentity, right: SourceProjectIdentity): SourceProjectIdentityRelationJudgment => {
    switch (left.root.value.value === right.root.value.value) {
      case true:
        let relation: Extract<SourceProjectIdentityRelationJudgment, { readonly kind: 'same_source_project_identity' }>;
        relation = Object.freeze({ kind: 'same_source_project_identity', identity: left, continueWith: <Result>(handlers: SourceProjectIdentityRelationHandlers<Result>): Result => handlers.onSame(relation) });
        return relation;
      case false: {
        let relation: Extract<SourceProjectIdentityRelationJudgment, { readonly kind: 'different_source_project_identity' }>;
        relation = Object.freeze({ kind: 'different_source_project_identity', left, right, continueWith: <Result>(handlers: SourceProjectIdentityRelationHandlers<Result>): Result => handlers.onDifferent(relation) });
        return relation;
      }
    }
  },
  relateSourceFiles: (left: SourceFile, right: SourceFile): SourceFileIdentityRelationJudgment => {
    switch (left.value.value === right.value.value) {
      case true: {
        const evidence = Object.freeze({ kind: 'same_source_file_identity' as const, identity: left });
        const relation: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }> = Object.freeze({
          ...evidence,
          continueWith: <Result>(handlers: SourceFileIdentityRelationHandlers<Result>): Result => handlers.onSame(relation),
        });
        return relation;
      }
      case false: {
        const evidence = Object.freeze({ kind: 'different_source_file_identity' as const, left, right });
        const relation: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }> = Object.freeze({
          ...evidence,
          continueWith: <Result>(handlers: SourceFileIdentityRelationHandlers<Result>): Result => handlers.onDifferent(relation),
        });
        return relation;
      }
    }
  },
});

/**
 * Canonical upstream construction of a Laravel source-project identity.
 *
 * This belongs to the upstream lane: it describes the source project consumed
 * by manifest construction. Legacy scanner facades may re-export it, but do
 * not own the implementation.
 */
export interface LaravelSourceProjectIdentityWithPolicyInput {
  readonly kind: 'laravel_source_project_identity_with_policy_input';
  readonly sourceRoot: SourceFile;
  readonly policyIntent: SemanticDataflowQueryPolicyIntent;
}

export interface LaravelSourceProjectIdentityFactoryInterface {
  readonly kind: 'laravel_source_project_identity_factory';
  readonly create: (sourceRoot: SourceFile) => SourceProjectIdentity;
  readonly createWithPolicy: (input: LaravelSourceProjectIdentityWithPolicyInput) => SourceProjectIdentity;
}

const sourceSpanForProjectRoot = (sourceRoot: SourceFile): SourceSpan => Object.freeze({
  kind: 'source_span',
  file: sourceRoot,
  start: numberValue(1),
  end: numberValue(1),
});

export const createLaravelSourceProjectIdentity: LaravelSourceProjectIdentityFactoryInterface = Object.freeze({
  kind: 'laravel_source_project_identity_factory',
  create: sourceRoot => Object.freeze({
    kind: 'laravel_project',
    root: sourceRoot,
    source: sourceSpanForProjectRoot(sourceRoot),
    queryPolicySelection: semanticDataflowQueryPolicySelectionFactory.defaultSelection,
  }),
  createWithPolicy: input => Object.freeze({
    kind: 'laravel_project',
    root: input.sourceRoot,
    source: sourceSpanForProjectRoot(input.sourceRoot),
    queryPolicySelection: semanticDataflowQueryPolicySelectionFactory.explicit(input.policyIntent),
  }),
});
