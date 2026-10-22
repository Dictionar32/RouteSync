import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { SourceFile } from './names';
import type { SemanticDataflowQueryPolicyIntent } from './semanticDataflowQueryPolicy';
import type { SourceSpan } from './provenance';
import type { NumberValue, StringValue } from './valueObjects';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const numberValue = (value: number): NumberValue => ({ kind: 'number_value', value });

/** Typed identity relations are semantic judgments, not primitive equality flags. */
export type SourceProjectIdentityRelationJudgment =
  | Readonly<{
      readonly kind: 'same_source_project_identity';
      readonly identity: SourceProjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'different_source_project_identity';
      readonly left: SourceProjectIdentity;
      readonly right: SourceProjectIdentity;
    }>;

export type SourceFileIdentityRelationJudgment =
  | Readonly<{
      readonly kind: 'same_source_file_identity';
      readonly identity: SourceFile;
    }>
  | Readonly<{
      readonly kind: 'different_source_file_identity';
      readonly left: SourceFile;
      readonly right: SourceFile;
    }>;

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
        return Object.freeze({ kind: 'same_source_project_identity', identity: left });
      case false:
        return Object.freeze({ kind: 'different_source_project_identity', left, right });
    }
  },
  relateSourceFiles: (left: SourceFile, right: SourceFile): SourceFileIdentityRelationJudgment => {
    switch (left.value.value === right.value.value) {
      case true:
        return Object.freeze({ kind: 'same_source_file_identity', identity: left });
      case false:
        return Object.freeze({ kind: 'different_source_file_identity', left, right });
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
export const createLaravelSourceProjectIdentity = (
  sourceRoot: string,
  dataflowQueryPolicyIntent?: SemanticDataflowQueryPolicyIntent,
): SourceProjectIdentity => {
  const source: SourceSpan = {
    kind: 'source_span',
    file: { kind: 'source_file', value: stringValue(sourceRoot) },
    start: numberValue(1),
    end: numberValue(1),
  };

  return {
    kind: 'laravel_project',
    root: source.file,
    source,
    ...(dataflowQueryPolicyIntent === undefined ? {} : { dataflowQueryPolicyIntent }),
  };
};
