import { createClassName, createMethodName, createTableName } from './names';
import { phpQualifiedClassNameFactory } from './phpClassNameResolutionInterface';
import { phpClassNameResolutionAuthority } from './phpClassNameResolutionAuthority';
import type {
  ControllerStaticCallClassReferenceResolutionJudgment,
  ControllerStaticCallClassReferenceResolutionRuleInterface,
  ControllerStaticCallModelClassIdentityJudgment,
  ControllerStaticCallModelClassIdentityRuleInterface,
  ControllerStaticCallOriginArgumentRuleInterface,
  ControllerStaticCallOriginAuthorityInterface,
  ControllerStaticCallOriginInput,
  ControllerStaticCallOriginJudgment,
  ControllerStaticCallOriginRuleInterface,
  ControllerStaticCallOriginRulePattern,
} from './controllerStaticCallOriginInterface';

const databaseFacadeQualifiedName = phpQualifiedClassNameFactory.create('Illuminate\\Support\\Facades\\DB');

const databaseFacadeTableCallPattern: ControllerStaticCallOriginRulePattern = Object.freeze({
  kind: 'qualified_class_method',
  className: databaseFacadeQualifiedName,
  methodName: createMethodName('table'),
});

const databaseFacadePattern: ControllerStaticCallOriginRulePattern = Object.freeze({
  kind: 'qualified_class',
  className: databaseFacadeQualifiedName,
});

const staticClassFallbackPattern: ControllerStaticCallOriginRulePattern = Object.freeze({ kind: 'fallback' });

const classReferenceResolutionRule: ControllerStaticCallClassReferenceResolutionRuleInterface = Object.freeze({
  kind: 'controller_static_call_class_reference_resolution_rule',
  contractVersion: 3,
  judge: input => {
    const sourceName = input.classReference.kind === 'simple_name'
      ? input.classReference.name
      : input.classReference.sourceName;
    const contextEvidence = input.classNameResolutionContext;
    switch (contextEvidence.kind) {
      case 'available':
        return phpClassNameResolutionAuthority.judge(Object.freeze({
          kind: 'php_class_name_resolution_input',
          sourceName,
          context: contextEvidence.context,
        }));
      case 'unavailable':
        return Object.freeze({
          kind: 'php_class_name_resolution_blocked',
          sourceName,
          reason: 'class_name_resolution_context_unavailable',
        });
    }
  },
});

const modelClassIdentityRule: ControllerStaticCallModelClassIdentityRuleInterface = Object.freeze({
  kind: 'controller_static_call_model_class_identity_rule',
  contractVersion: 2,
  judge: (input, classReferenceJudgment) => {
    if (classReferenceJudgment.kind === 'php_class_name_resolution_blocked') {
      return { kind: 'blocked', reason: 'canonical_qualified_model_identity_unavailable' };
    }
    const resolvedName = classReferenceJudgment.qualifiedName.value.value;
    const matchingIdentities = input.modelClasses.filter(identity =>
      identity.qualifiedName.value.value.toLowerCase() === resolvedName.toLowerCase(),
    );
    switch (matchingIdentities.length) {
      case 0:
        return { kind: 'not_found' };
      case 1: {
        const identity = matchingIdentities[0];
        return identity === undefined ? { kind: 'not_found' } : { kind: 'resolved', identity };
      }
      default:
        return { kind: 'ambiguous', identities: Object.freeze(matchingIdentities) };
    }
  },
});

const databaseTableLiteralArgumentRule: ControllerStaticCallOriginArgumentRuleInterface = Object.freeze({
  kind: 'controller_static_call_origin_argument_rule',
  rule: 'table_literal',
  evidenceKind: 'positional_string_literal',
  judge: input => {
    switch (input.tableArgument.kind) {
      case 'positional_string_literal':
        return {
          kind: 'resolved',
          rule: 'database_facade_table_literal',
          origin: { kind: 'table', name: createTableName(input.tableArgument.value.value) },
        };
      case 'absent':
        return { kind: 'unresolved', reason: 'database_table_argument_absent' };
      case 'unsupported_argument_shape':
        return { kind: 'unresolved', reason: 'database_table_argument_not_static_string' };
    }
  },
});

const databaseTableArgumentAbsentRule: ControllerStaticCallOriginArgumentRuleInterface = Object.freeze({
  kind: 'controller_static_call_origin_argument_rule',
  rule: 'table_argument_absent',
  evidenceKind: 'absent',
  judge: () => ({ kind: 'unresolved', reason: 'database_table_argument_absent' }),
});

const databaseTableArgumentUnsupportedRule: ControllerStaticCallOriginArgumentRuleInterface = Object.freeze({
  kind: 'controller_static_call_origin_argument_rule',
  rule: 'table_argument_unsupported',
  evidenceKind: 'unsupported_argument_shape',
  judge: () => ({ kind: 'unresolved', reason: 'database_table_argument_not_static_string' }),
});

const databaseTableArgumentRules: readonly ControllerStaticCallOriginArgumentRuleInterface[] = Object.freeze([
  databaseTableLiteralArgumentRule,
  databaseTableArgumentAbsentRule,
  databaseTableArgumentUnsupportedRule,
]);

const databaseTableOrigin = (input: ControllerStaticCallOriginInput): ControllerStaticCallOriginJudgment => {
  const matchingRule = databaseTableArgumentRules.find(rule => rule.evidenceKind === input.tableArgument.kind);
  return matchingRule === undefined
    ? { kind: 'unresolved', reason: 'database_table_argument_not_static_string' }
    : matchingRule.judge(input);
};

const databaseFacadeTableRule: ControllerStaticCallOriginRuleInterface = Object.freeze({
  kind: 'controller_static_call_origin_rule',
  rule: 'database_facade_table_literal',
  pattern: databaseFacadeTableCallPattern,
  argumentRules: databaseTableArgumentRules,
  judge: databaseTableOrigin,
});

const databaseFacadeNonTableCallRule: ControllerStaticCallOriginRuleInterface = Object.freeze({
  kind: 'controller_static_call_origin_rule',
  rule: 'database_facade_non_table_call',
  pattern: databaseFacadePattern,
  argumentRules: Object.freeze([]),
  judge: () => ({ kind: 'not_applicable', reason: 'database_facade_call_without_table_origin' }),
});

const staticClassModelOriginRule: ControllerStaticCallOriginRuleInterface = Object.freeze({
  kind: 'controller_static_call_origin_rule',
  rule: 'static_class_model_origin',
  pattern: staticClassFallbackPattern,
  argumentRules: Object.freeze([]),
  judge: (input, classReferenceJudgment): ControllerStaticCallOriginJudgment => {
    const identityJudgment: ControllerStaticCallModelClassIdentityJudgment = modelClassIdentityRule.judge(input, classReferenceJudgment);
    switch (identityJudgment.kind) {
      case 'resolved':
        return {
          kind: 'resolved',
          rule: 'static_class_model_origin',
          origin: { kind: 'model_class', name: identityJudgment.identity.modelName },
        };
      case 'not_found':
        return { kind: 'not_applicable', reason: 'static_call_class_not_in_model_catalog' };
      case 'ambiguous':
        return { kind: 'unresolved', reason: 'static_call_model_class_ambiguous' };
      case 'blocked':
        return { kind: 'unresolved', reason: 'static_call_qualified_model_identity_unavailable' };
    }
  },
});

const controllerStaticCallOriginRules: readonly ControllerStaticCallOriginRuleInterface[] = Object.freeze([
  databaseFacadeTableRule,
  databaseFacadeNonTableCallRule,
  staticClassModelOriginRule,
]);

const rulePatternMatches = (
  pattern: ControllerStaticCallOriginRulePattern,
  input: ControllerStaticCallOriginInput,
  classReferenceJudgment: ControllerStaticCallClassReferenceResolutionJudgment,
): boolean => {
  switch (pattern.kind) {
    case 'qualified_class_method':
      return classReferenceJudgment.kind === 'php_class_name_resolved' &&
        pattern.className.value.value.toLowerCase() === classReferenceJudgment.qualifiedName.value.value.toLowerCase() &&
        pattern.methodName.value.value.toLowerCase() === input.methodName.value.value.toLowerCase();
    case 'qualified_class':
      return classReferenceJudgment.kind === 'php_class_name_resolved' &&
        pattern.className.value.value.toLowerCase() === classReferenceJudgment.qualifiedName.value.value.toLowerCase();
    case 'fallback':
      return true;
  }
};

export const controllerStaticCallOriginAuthority: ControllerStaticCallOriginAuthorityInterface = Object.freeze({
  kind: 'controller_static_call_origin_authority',
  contractVersion: 11,
  judgmentContract: 'use_one_discriminated_class_reference_and_context_evidence_then_pass_the_same_closed_judgment_to_rule_matching_and_model_identity',
  classReferenceResolutionRule,
  rules: controllerStaticCallOriginRules,
  modelClassIdentityRule,
  judge: (input: ControllerStaticCallOriginInput): ControllerStaticCallOriginJudgment => {
    const classReferenceJudgment = classReferenceResolutionRule.judge(input);
    const matchingRule = controllerStaticCallOriginRules.find(rule => rulePatternMatches(rule.pattern, input, classReferenceJudgment));
    return matchingRule === undefined
      ? { kind: 'not_applicable', reason: 'no_matching_static_call_origin_rule' }
      : matchingRule.judge(input, classReferenceJudgment);
  },
});
