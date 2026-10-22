import type {
  ControllerParameterClassNameJudgment,
  ControllerParameterClassNameJudgmentInterface,
  ControllerParameterClassNameReasoningContract,
} from '../../../types/upstream/controllerParameterClassNameJudgmentInterface';
import { createClassName } from '../../../types/upstream/names';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';

const controllerParameterClassNameRules: ControllerParameterClassNameReasoningContract['rules'] = [
  { kind: 'model_class_name_rule', premise: 'model_origin_with_model_class', conclusion: 'resolved_class_name' },
  { kind: 'request_class_name_rule', premise: 'request_origin', conclusion: 'resolved_class_name' },
  { kind: 'table_origin_non_class_rule', premise: 'model_origin_with_table', conclusion: 'unresolved_class_name' },
  { kind: 'non_class_expression_rule', premise: 'expression_or_external_origin', conclusion: 'unresolved_class_name' },
];

const controllerParameterClassNameReasoning: ControllerParameterClassNameReasoningContract = Object.freeze({
  kind: 'controller_parameter_class_name_reasoning_contract',
  authority: 'upstream',
  closed: true,
  rules: Object.freeze(controllerParameterClassNameRules),
});

/** Executes the upstream closed rule contract and returns a source-correlated ADT. */
export const controllerParameterClassNameJudgmentAuthority: ControllerParameterClassNameJudgmentInterface = Object.freeze({
  kind: 'controller_parameter_class_name_judgment_authority',
  reasoning: controllerParameterClassNameReasoning,
  judge: (semantic: ControllerVariableSemantic): ControllerParameterClassNameJudgment => {
    switch (semantic.kind) {
      case 'model_origin':
        switch (semantic.origin.kind) {
          case 'model_class':
            return Object.freeze({
              kind: 'controller_parameter_class_name_resolved',
              source: 'model_class',
              name: createClassName(semantic.origin.name.value.value),
              closed: true,
            });
          case 'table':
            return Object.freeze({ kind: 'controller_parameter_class_name_unresolved', reason: 'table_origin', closed: true });
        }
      case 'request_origin':
        return Object.freeze({
          kind: 'controller_parameter_class_name_resolved',
          source: 'request_origin',
          name: createClassName(semantic.name.value.value),
          closed: true,
        });
      case 'expression':
        return Object.freeze({ kind: 'controller_parameter_class_name_unresolved', reason: 'expression_origin', closed: true });
      case 'external':
        return Object.freeze({ kind: 'controller_parameter_class_name_unresolved', reason: 'external_origin', closed: true });
    }
  },
});
