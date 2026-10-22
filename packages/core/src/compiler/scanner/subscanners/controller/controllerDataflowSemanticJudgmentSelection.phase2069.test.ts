import { describe, expect, it } from 'vitest';
import { createControllerSemanticVariableIndex, lookupControllerSemanticJudgment } from './controllerDataflowContract';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { controllerVariableSemanticAuthority } from '../../../../types/upstream/controllerVariableSemanticAuthority';
import { stringValue, numberValue } from '../../../../types/upstream/valueObjects';
import type { ControllerVariableBinding, ControllerVariableDefinition } from '../../../../types/upstream/controller';
import type { Expression } from '../../../../types/upstream/expression';
import type { Sequence } from '../../../../types/upstream/collections';
import type { SourceSpan } from '../../../../types/upstream/provenance';

const source: SourceSpan = Object.freeze({
  kind: 'source_span',
  file: Object.freeze({ kind: 'source_file', value: stringValue('Controller.php') }),
  start: numberValue(0),
  end: numberValue(1),
});

const expression: Expression = Object.freeze({
  kind: 'unsupported_expression',
  reason: { kind: 'unsupported_syntax' },
  source,
});

const definitions = (items: readonly ControllerVariableDefinition[]): Sequence<ControllerVariableDefinition> =>
  items.reduceRight<Sequence<ControllerVariableDefinition>>(
    (tail, head) => ({ kind: 'cons', head, tail }),
    { kind: 'empty' },
  );

describe('controller dataflow semantic judgment selection phase 2069', () => {
  it('selects the final source-ordered definition instead of the first definition', () => {
    const variable = SemanticValueFactory.variableName('record');
    const first = controllerVariableSemanticAuthority.resolve({
      sourceExpression: expression,
      evidence: { kind: 'other_expression' },
      parameterBindings: [],
    });
    const latest = controllerVariableSemanticAuthority.resolve({
      sourceExpression: expression,
      evidence: {
        kind: 'static_call',
        className: 'DB',
        methodName: 'table',
        arguments: [{ kind: 'positional_string_literal', value: 'orders' }],
      },
      parameterBindings: [],
    });
    const binding: ControllerVariableBinding = {
      variable,
      definitions: definitions([
        { variable, origin: { kind: 'value' }, semanticResolution: first, source },
        { variable, origin: { kind: 'value' }, semanticResolution: latest, source },
      ]),
    };
    const index = createControllerSemanticVariableIndex([binding]);

    expect(lookupControllerSemanticJudgment(index, variable)).toEqual({ kind: 'found', value: latest });
  });

  it('returns missing when a binding has no definitions', () => {
    const variable = SemanticValueFactory.variableName('record');
    const binding: ControllerVariableBinding = {
      variable,
      definitions: { kind: 'empty' },
    };

    expect(lookupControllerSemanticJudgment(createControllerSemanticVariableIndex([binding]), variable)).toEqual({ kind: 'missing' });
  });
});
