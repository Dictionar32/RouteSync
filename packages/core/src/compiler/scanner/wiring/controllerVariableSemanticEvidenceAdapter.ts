import { relationOptionFold, relationRefine } from '../../../semantic/relations/relationalSequence';
import { relationEqual } from '../../../semantic/relations/semanticRelations';
import type { ControllerVariableSemanticEvidence } from '../../../types/upstream/controllerVariableSemanticInterface';
import type { PhpAstValue } from '../../frontend/php/phpAstTypes';

type StringLiteralValue = Extract<PhpAstValue, { readonly kind: 'literal'; readonly literalType: 'string' }>;
const isStringLiteral = (candidate: PhpAstValue): candidate is StringLiteralValue => relationOptionFold(
  relationRefine(candidate, (value): value is Extract<PhpAstValue, { readonly kind: 'literal' }> => relationEqual(value.kind, 'literal')),
  () => false,
  value => relationEqual(value.literalType, 'string'),
);

export interface ControllerVariableSemanticEvidenceAdapterInterface {
  readonly fromPhpAst: (value: PhpAstValue) => ControllerVariableSemanticEvidence;
}

/** Maps parser-owned AST shape to upstream's parser-neutral evidence vocabulary. */
export const controllerVariableSemanticEvidenceAdapter: ControllerVariableSemanticEvidenceAdapterInterface = Object.freeze({
  fromPhpAst: (value: PhpAstValue): ControllerVariableSemanticEvidence => {
  if (value.kind === 'variable_reference') return Object.freeze({
    kind: 'variable_reference',
    variable: { kind: 'variable_name' as const, value: { kind: 'string_value' as const, value: value.name } },
  });
  if (value.kind === 'static_call') return Object.freeze({
    kind: 'static_call',
    className: value.classReference.sourceName,
    methodName: value.method,
    arguments: Object.freeze(value.arguments.map(argument => {
      if (argument.kind === 'named') return Object.freeze({ kind: 'named_argument' as const });
      if (argument.kind === 'unpacked') return Object.freeze({ kind: 'unpacked_argument' as const });
      return relationOptionFold(
        relationRefine(argument.value, isStringLiteral),
        () => Object.freeze({ kind: 'positional_non_string' as const }),
        literal => Object.freeze({ kind: 'positional_string_literal' as const, value: literal.value }),
      );
    })),
  });
  return Object.freeze({ kind: 'other_expression' });
  },
});
