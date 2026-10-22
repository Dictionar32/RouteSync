import { describe, expect, it } from 'vitest';
import { laravelDtoResponseValueProjectionAuthority, laravelDtoResponseValueProjectionRuntimeExecutor } from '../laravelDtoResponseValueProjectionAuthority';
import type { TypeExpression } from '../typeVocabulary';
import type { SourceSpan } from '../provenance';

const source: SourceSpan = Object.freeze({
  kind: 'source_span',
  file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: 'UserDto.php' }) }),
  start: Object.freeze({ kind: 'number_value', value: 4 }),
  end: Object.freeze({ kind: 'number_value', value: 4 }),
});

const notRequired = Object.freeze({ kind: 'response_value_reference_binding_not_required' as const });

const project = (expression: TypeExpression) => laravelDtoResponseValueProjectionAuthority.project(Object.freeze({
  kind: 'laravel_dto_response_value_projection_input',
  expression,
  source,
  referenceBinding: notRequired,
}));

describe('Laravel DTO response value projection authority', () => {
  it('preserves integer and decimal response meaning', () => {
    expect(project({ kind: 'primitive', value: { kind: 'integer' } })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_resolved',
      value: { kind: 'scalar', value: { kind: 'whole_number' } },
    });
    expect(project({ kind: 'primitive', value: { kind: 'decimal' } })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_resolved',
      value: { kind: 'scalar', value: { kind: 'decimal_number' } },
    });
  });

  it('does not guess the legacy collapsed number or JSON vocabulary', () => {
    expect(project({ kind: 'primitive', value: { kind: 'number' } })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_unresolved',
      reason: 'primitive-vocabulary-does-not-preserve-response-meaning',
    });
    expect(project({ kind: 'primitive', value: { kind: 'json' } })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_unresolved',
      reason: 'primitive-vocabulary-does-not-preserve-response-meaning',
    });
  });

  it('projects typed collections and nullable values without dropping null', () => {
    expect(project({ kind: 'array', element: { kind: 'primitive', value: { kind: 'integer' } } })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_resolved',
      value: { kind: 'collection', element: { kind: 'scalar', value: { kind: 'whole_number' } } },
    });
    expect(project({ kind: 'nullable', value: { kind: 'primitive', value: { kind: 'string' } } })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_resolved',
      value: { kind: 'union', members: [{ kind: 'scalar', value: { kind: 'textual' } }, { kind: 'null' }] },
    });
  });

  it('requires canonical binding for class references and closes unions conservatively', () => {
    expect(project({ kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: { kind: 'string_value', value: 'UserDto' } } } })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_unresolved',
      reason: 'class-reference-binding-not-provided',
    });
    expect(project({
      kind: 'union',
      members: {
        kind: 'type_expressions',
        items: {
          kind: 'cons',
          head: { kind: 'primitive', value: { kind: 'string' } },
          tail: { kind: 'cons', head: { kind: 'primitive', value: { kind: 'number' } }, tail: { kind: 'empty' } },
        },
      },
    })).toMatchObject({
      kind: 'laravel_dto_response_value_projection_unresolved',
      reason: 'union-member-unresolved',
    });
  });

  it('runtime executor forwards the authority judgment unchanged', () => {
    const input = Object.freeze({ kind: 'laravel_dto_response_value_projection_input' as const, expression: { kind: 'primitive' as const, value: { kind: 'integer' as const } }, source, referenceBinding: notRequired });
    expect(laravelDtoResponseValueProjectionRuntimeExecutor.execute(input)).toEqual(laravelDtoResponseValueProjectionAuthority.project(input));
  });
});
