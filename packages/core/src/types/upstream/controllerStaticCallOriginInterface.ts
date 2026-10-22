import type { ClassName, MethodName, ModelName } from './names';
import type { ControllerModelOrigin } from './controller';
import type { StringValue } from './valueObjects';
import type { PhpClassNameResolution, PhpClassNameResolutionContext, PhpQualifiedClassName } from './phpClassNameResolutionInterface';

/** Structural argument evidence normalized from a PHP static-call AST node. */
export type ControllerStaticCallTableArgumentEvidence =
  | { readonly kind: 'absent' }
  | { readonly kind: 'positional_string_literal'; readonly value: StringValue }
  | { readonly kind: 'unsupported_argument_shape' };

/** Canonical source-model identity associated with a statically declared Laravel model class. */
export interface ControllerStaticCallModelClassIdentity {
  readonly kind: 'controller_static_call_model_class_identity';
  readonly className: ClassName;
  readonly modelName: ModelName;
  /** Fully qualified identity derived from the model declaration's lexical namespace. */
  readonly qualifiedName: PhpQualifiedClassName;
}

/** Typed source facts needed to judge the origin of a static call. */
export type ControllerStaticCallClassReferenceEvidence =
  | Readonly<{ readonly kind: 'simple_name'; readonly name: ClassName }>
  | Readonly<{
      readonly kind: 'qualified_name';
      readonly sourceName: ClassName;
      readonly form: 'fully_qualified' | 'namespace_relative' | 'import_or_namespace_dependent';
    }>;

export type ControllerStaticCallClassNameResolutionContext = PhpClassNameResolutionContext;

/** Explicitly distinguishes absent lexical evidence from an empty namespace/import table. */
export type ControllerStaticCallClassNameResolutionContextEvidence =
  | Readonly<{ readonly kind: 'available'; readonly context: PhpClassNameResolutionContext }>
  | Readonly<{ readonly kind: 'unavailable'; readonly reason: 'controller_method_lexical_context_missing' }>;

export interface ControllerStaticCallOriginInput {
  readonly kind: 'controller_static_call_origin_input';
  /** The discriminated reference is the sole authority for the source class spelling. */
  readonly classReference: ControllerStaticCallClassReferenceEvidence;
  /** Lexical context belongs to the controller source file and is required for non-FQCN resolution. */
  readonly classNameResolutionContext: ControllerStaticCallClassNameResolutionContextEvidence;
  readonly methodName: MethodName;
  readonly tableArgument: ControllerStaticCallTableArgumentEvidence;
  /** Canonical model identities scanned from the same Laravel source project. */
  readonly modelClasses: readonly ControllerStaticCallModelClassIdentity[];
}

export type ControllerStaticCallOriginJudgment =
  | {
      readonly kind: 'resolved';
      readonly rule: 'database_facade_table_literal';
      readonly origin: Extract<ControllerModelOrigin, { readonly kind: 'table' }>;
    }
  | {
      readonly kind: 'resolved';
      readonly rule: 'static_class_model_origin';
      readonly origin: Extract<ControllerModelOrigin, { readonly kind: 'model_class' }>;
    }
  | {
      readonly kind: 'unresolved';
      readonly reason:
        | 'database_table_argument_absent'
        | 'database_table_argument_not_static_string'
        | 'static_call_model_class_ambiguous'
        | 'static_call_qualified_model_identity_unavailable';
    }
  | {
      readonly kind: 'not_applicable';
      readonly reason:
        | 'database_facade_call_without_table_origin'
        | 'no_matching_static_call_origin_rule'
        | 'static_call_class_not_in_model_catalog';
    };

export type ControllerStaticCallOriginRulePattern =
  | Readonly<{ readonly kind: 'qualified_class_method'; readonly className: PhpQualifiedClassName; readonly methodName: MethodName }>
  | Readonly<{ readonly kind: 'qualified_class'; readonly className: PhpQualifiedClassName }>
  | Readonly<{ readonly kind: 'fallback' }>;

/** Argument evidence is interpreted through a declared subrule, not an inline switch. */
export interface ControllerStaticCallOriginArgumentRuleInterface {
  readonly kind: 'controller_static_call_origin_argument_rule';
  readonly rule: 'table_literal' | 'table_argument_absent' | 'table_argument_unsupported';
  readonly evidenceKind: ControllerStaticCallTableArgumentEvidence['kind'];
  readonly judge: (input: ControllerStaticCallOriginInput) => ControllerStaticCallOriginJudgment;
}

/** Compatibility name for the canonical upstream PHP class-name judgment ADT. */
export type ControllerStaticCallClassReferenceResolutionJudgment = PhpClassNameResolution;

export interface ControllerStaticCallClassReferenceResolutionRuleInterface {
  readonly kind: 'controller_static_call_class_reference_resolution_rule';
  readonly contractVersion: 3;
  readonly judge: (input: ControllerStaticCallOriginInput) => ControllerStaticCallClassReferenceResolutionJudgment;
}

export type ControllerStaticCallModelClassIdentityJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly identity: ControllerStaticCallModelClassIdentity }>
  | Readonly<{ readonly kind: 'not_found' }>
  | Readonly<{ readonly kind: 'ambiguous'; readonly identities: readonly ControllerStaticCallModelClassIdentity[] }>
  | Readonly<{ readonly kind: 'blocked'; readonly reason: 'canonical_qualified_model_identity_unavailable' }>;

/** Resolves a PHP class reference only against canonical model identities from the scanned source project. */
export interface ControllerStaticCallModelClassIdentityRuleInterface {
  readonly kind: 'controller_static_call_model_class_identity_rule';
  readonly contractVersion: 2;
  readonly judge: (input: ControllerStaticCallOriginInput, classReferenceJudgment: ControllerStaticCallClassReferenceResolutionJudgment) => ControllerStaticCallModelClassIdentityJudgment;
}

/** A declarative semantic rule owns its applicability pattern and typed argument rules. */
export interface ControllerStaticCallOriginRuleInterface {
  readonly kind: 'controller_static_call_origin_rule';
  readonly rule: 'database_facade_table_literal' | 'database_facade_non_table_call' | 'static_class_model_origin';
  readonly pattern: ControllerStaticCallOriginRulePattern;
  readonly argumentRules: readonly ControllerStaticCallOriginArgumentRuleInterface[];
  readonly judge: (input: ControllerStaticCallOriginInput, classReferenceJudgment: ControllerStaticCallClassReferenceResolutionJudgment) => ControllerStaticCallOriginJudgment;
}

/** Upstream authority interprets static-call evidence through ordered semantic rules. */
export interface ControllerStaticCallOriginAuthorityInterface {
  readonly kind: 'controller_static_call_origin_authority';
  readonly contractVersion: 11;
  readonly classReferenceResolutionRule: ControllerStaticCallClassReferenceResolutionRuleInterface;
  readonly rules: readonly ControllerStaticCallOriginRuleInterface[];
  readonly modelClassIdentityRule: ControllerStaticCallModelClassIdentityRuleInterface;
  readonly judgmentContract: 'use_one_discriminated_class_reference_and_context_evidence_then_pass_the_same_closed_judgment_to_rule_matching_and_model_identity';
  readonly judge: (input: ControllerStaticCallOriginInput) => ControllerStaticCallOriginJudgment;
}
