import { describe, expect, it } from 'vitest';
import { queryProducerSemanticAlgebra } from '../queryProducerSemanticAlgebra';
import { queryProducerSemanticReasoning } from '../queryProducerSemanticReasoning';
import { createClassName, createMethodName, createModelName, stringValue, sourceFileIdentityFactory } from '../names';
import { numberValue } from '../valueObjects';
import type { SourceSpan } from '../provenance';
import type { Expression } from '../expression';
import { RELATION_NONE } from '../../../semantic/relations/relationalSequence';
import { queryOperationSemanticRuleRequirements, validateQueryOperationSemanticRuleCatalog, type QueryOperationSemanticRuleDeclaration } from '../queryProducerSemanticInterface';

const source: SourceSpan = { kind: 'source_span', file: sourceFileIdentityFactory.create(stringValue.create('User.php')), start: numberValue(0), end: numberValue(12) };
const stringExpression = (value: string): Expression => ({ kind: 'literal', value: { kind: 'string_literal', value: { kind: 'string_value', value } }, source });
const arrayExpression = (values: readonly Expression[]): Expression => ({
  kind: 'array',
  entries: values.reduceRight<import('../collections').Sequence<import('../expression').ArrayEntry>>((tail, value, index) => ({
    kind: 'cons', head: { kind: 'implicit', index: numberValue(index), value, source }, tail,
  }), { kind: 'empty' }),
  source,
});

describe('query producer semantic reasoning boundary', () => {
  it('keeps the existing interface facade wired to the reasoning implementation', () => {
    expect(queryProducerSemanticAlgebra).toBe(queryProducerSemanticReasoning);
  });
});

describe('query producer semantic algebra JSON authority', () => {
  it('resolves JSON predicates through the existing upstream operation authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereJsonContains'),
      arguments: [stringExpression('profile->tags'), stringExpression('typescript')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_json_condition_rule' },
      contract: {
        rule: 'query_json_condition_rule',
        conclusion: { kind: 'query_operation_ast', family: 'query_json_condition_rule' },
        outcomes: ['resolved', 'malformed', 'undetermined'],
      },
      operation: { kind: 'instance', operation: { kind: 'where', condition: { kind: 'json', condition: { kind: 'contains', column: { value: { value: 'profile' } }, value: stringExpression('typescript') } } } },
    });
  });

  it('resolves JSON length predicates with explicit comparison operators', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereJsonLength'),
      arguments: [stringExpression('profile->tags'), stringExpression('>'), stringExpression('2')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_json_condition_rule' },
      derivation: {
        kind: 'query_operation_derivation',
        rule: 'query_json_condition_rule',
        methodName: 'orWhereJsonLength',
        argumentCount: 3,
        outcome: 'resolved',
        conclusion: { kind: 'query_operation_ast', family: 'query_json_condition_rule' },
      },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'json', condition: { kind: 'length', operator: { kind: 'greater' } } } } },
    });
  });

  it('preserves malformed JSON evidence in the existing semantic authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereJsonContains'),
      arguments: [stringExpression('profile->tags')],
    })).toMatchObject({
      kind: 'malformed',
      rule: { kind: 'query_json_condition_rule' },
      contract: {
        rule: 'query_json_condition_rule',
        conclusion: { kind: 'query_operation_ast', family: 'query_json_condition_rule' },
        outcomes: ['resolved', 'malformed', 'undetermined'],
      },
      derivation: {
        kind: 'query_operation_derivation',
        rule: 'query_json_condition_rule',
        methodName: 'whereJsonContains',
        argumentCount: 1,
        outcome: 'malformed',
        conclusion: { kind: 'query_semantic_diagnostic' },
      },
    });
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereJsonLength'),
      arguments: [stringExpression('profile->tags'), stringExpression('sideways'), stringExpression('2')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_json_condition_rule' } });
  });
});

describe('query producer semantic algebra phase 1487', () => {
  it('resolves model provenance in the upstream semantic authority', () => {
    const model = createModelName('User');
    expect(queryProducerSemanticAlgebra.resolveModelOrigin({
      kind: 'model_reference', model, cardinality: { kind: 'single' }, source,
    })).toEqual({ kind: 'resolved', value: model });
  });

  it('resolves only recognized model-producing static operations', () => {
    const evidence: Expression = {
      kind: 'static_method',
      receiver: { kind: 'class', name: createClassName('User') },
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('all') } },
      arguments: { kind: 'expression_arguments', items: { kind: 'empty' } },
      source,
    };
    expect(queryProducerSemanticAlgebra.resolveModelOrigin(evidence)).toEqual({
      kind: 'resolved', value: createModelName('User'),
    });
    expect(queryProducerSemanticAlgebra.resolveModelOrigin({
      ...evidence,
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('mystery') } },
    })).toEqual({ kind: 'not_applicable' });
  });

  it('rejects known model-producing static operations with invalid argument evidence', () => {
    const evidence: Expression = {
      kind: 'static_method',
      receiver: { kind: 'class', name: createClassName('User') },
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('where') } },
      arguments: { kind: 'expression_arguments', items: { kind: 'empty' } },
      source,
    };
    expect(queryProducerSemanticAlgebra.resolveModelOrigin(evidence)).toMatchObject({ kind: 'malformed' });
  });

  it('rejects a model-origin operation when its optional ordering direction violates the upstream contract', () => {
    const evidence: Expression = {
      kind: 'static_method',
      receiver: { kind: 'class', name: createClassName('User') },
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('orderBy') } },
      arguments: { kind: 'expression_arguments', items: {
        kind: 'cons', head: { kind: 'positional', value: stringExpression('created_at') },
        tail: { kind: 'cons', head: { kind: 'positional', value: stringExpression('sideways') }, tail: { kind: 'empty' } },
      } },
      source,
    };
    expect(queryProducerSemanticAlgebra.resolveModelOrigin(evidence)).toMatchObject({ kind: 'malformed' });
  });

  it('keeps model-origin evidence closed against malformed static operation contracts', () => {
    const base: Expression = {
      kind: 'static_method',
      receiver: { kind: 'class', name: createClassName('User') },
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('select') } },
      arguments: { kind: 'expression_arguments', items: { kind: 'empty' } },
      source,
    };
    expect(queryProducerSemanticAlgebra.resolveModelOrigin(base)).toMatchObject({ kind: 'malformed' });
    expect(queryProducerSemanticAlgebra.resolveModelOrigin({
      ...base,
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('with') } },
      arguments: { kind: 'expression_arguments', items: { kind: 'cons', head: { kind: 'positional', value: stringExpression('posts..comments') }, tail: { kind: 'empty' } } },
    })).toMatchObject({ kind: 'malformed' });
  });
  it('resolves a complete model-static operation contract upstream', () => {
    const evidence: Expression = {
      kind: 'static_method',
      receiver: { kind: 'class', name: createClassName('User') },
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('orderBy') } },
      arguments: { kind: 'expression_arguments', items: {
        kind: 'cons', head: { kind: 'positional', value: stringExpression('created_at') },
        tail: { kind: 'cons', head: { kind: 'positional', value: stringExpression('desc') }, tail: { kind: 'empty' } },
      } },
      source,
    };
    expect(queryProducerSemanticAlgebra.resolveModelStaticOperation(evidence)).toMatchObject({
      kind: 'resolved',
      value: {
        model: createModelName('User'),
        operation: { kind: 'order_by', target: { kind: 'property' }, direction: { kind: 'descending' } },
      },
    });
  });

  it('rejects unsupported static where operators in the upstream contract', () => {
    const evidence: Expression = {
      kind: 'static_method',
      receiver: { kind: 'class', name: createClassName('User') },
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('where') } },
      arguments: { kind: 'expression_arguments', items: {
        kind: 'cons', head: { kind: 'positional', value: stringExpression('status') },
        tail: { kind: 'cons', head: { kind: 'positional', value: stringExpression('sideways') },
          tail: { kind: 'cons', head: { kind: 'positional', value: stringExpression('active') }, tail: { kind: 'empty' } } },
      } },
      source,
    };
    expect(queryProducerSemanticAlgebra.resolveModelStaticOperation(evidence)).toMatchObject({ kind: 'malformed' });
  });

  it('rejects malformed model-static operations before scanner projection', () => {
    const evidence: Expression = {
      kind: 'static_method',
      receiver: { kind: 'class', name: createClassName('User') },
      action: { kind: 'domain', name: { kind: 'method_name', value: stringValue.create('orderBy') } },
      arguments: { kind: 'expression_arguments', items: {
        kind: 'cons', head: { kind: 'positional', value: stringExpression('created_at') },
        tail: { kind: 'cons', head: { kind: 'positional', value: stringExpression('sideways') }, tail: { kind: 'empty' } },
      } },
      source,
    };
    expect(queryProducerSemanticAlgebra.resolveModelStaticOperation(evidence)).toMatchObject({ kind: 'malformed' });
  });

  it('resolves property and relation names from typed literal evidence upstream', () => {
    expect(queryProducerSemanticAlgebra.resolvePropertyName(stringExpression('created_at'))).toMatchObject({
      kind: 'resolved', value: { kind: 'property_name', value: { value: 'created_at' } },
    });
    expect(queryProducerSemanticAlgebra.resolveRelationName(stringExpression('posts'))).toMatchObject({
      kind: 'resolved', value: { kind: 'relation_name', value: { value: 'posts' } },
    });
  });

  it('distinguishes absent name evidence from malformed name evidence', () => {
    expect(queryProducerSemanticAlgebra.resolvePropertyName(RELATION_NONE)).toEqual({ kind: 'not_applicable' });
    expect(queryProducerSemanticAlgebra.resolveRelationName(RELATION_NONE)).toEqual({ kind: 'not_applicable' });
    expect(queryProducerSemanticAlgebra.resolvePropertyName({ kind: 'variable', name: { kind: 'variable_name', value: stringValue.create('column') }, source })).toMatchObject({ kind: 'malformed' });
  });

  it('resolves relation aggregate vocabulary as a closed judgment', () => {
    expect(queryProducerSemanticAlgebra.resolveRelationAggregateFunction(createMethodName('withCount'))).toEqual({
      kind: 'resolved',
      value: { kind: 'count' },
    });
  });

  it('rejects unknown relation aggregate vocabulary as not applicable', () => {
    expect(queryProducerSemanticAlgebra.resolveRelationAggregateFunction(createMethodName('withMystery'))).toEqual({
      kind: 'not_applicable',
    });
  });

  it('resolves relation aggregate path evidence inside the semantic algebra', () => {
    const judgment = queryProducerSemanticAlgebra.resolveRelationAggregate(createMethodName('withCount'), [stringExpression('posts')], source);
    expect(judgment.kind).toBe('resolved');
    expect(queryProducerSemanticAlgebra.toLegacyOption(judgment)).toEqual({ kind: 'some', value: expect.objectContaining({ function: { kind: 'count' }, alias: { kind: 'none' } }) });
  });

  it('keeps malformed known aggregate evidence distinct from unknown vocabulary', () => {
    expect(queryProducerSemanticAlgebra.resolveRelationAggregate(createMethodName('withCount'), [], source)).toEqual({
      kind: 'malformed', diagnostic: { kind: 'query_semantic_diagnostic', message: { kind: 'description_text', value: 'relation aggregate requires a relation path argument' } },
    });
    expect(queryProducerSemanticAlgebra.resolveRelationAggregate(createMethodName('withMystery'), [], source)).toEqual({ kind: 'not_applicable' });
  });

  it('resolves relation paths through the canonical semantic interface', () => {
    expect(queryProducerSemanticAlgebra.resolveRelationPath(stringExpression('posts:id,name'))).toMatchObject({
      kind: 'resolved',
      value: { kind: 'relation_path', selectedColumns: { kind: 'some' } },
    });
  });

  it('retains malformed relation-path evidence as a judgment', () => {
    expect(queryProducerSemanticAlgebra.resolveRelationPath(stringExpression('posts::id'))).toMatchObject({
      kind: 'malformed',
    });
    expect(queryProducerSemanticAlgebra.resolveRelationPath(stringExpression('posts..comments'))).toMatchObject({
      kind: 'malformed',
    });
  });

  it('resolves grouping as one semantic judgment instead of producer-local classification', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryGrouping([stringExpression('created_at')])).toMatchObject({
      kind: 'resolved',
      value: { kind: 'query_grouping', targets: { kind: 'cons', head: { kind: 'property' } } },
    });
    expect(queryProducerSemanticAlgebra.resolveQueryGrouping([])).toMatchObject({ kind: 'malformed' });
  });

  it('rejects unknown ordering direction instead of silently classifying it as ascending', () => {
    expect(queryProducerSemanticAlgebra.resolveOrderingDirection(stringExpression('sideways'))).toMatchObject({ kind: 'malformed' });
    expect(queryProducerSemanticAlgebra.resolveOrderingDirection(stringExpression('desc'))).toEqual({ kind: 'resolved', value: { kind: 'descending' } });
    expect(queryProducerSemanticAlgebra.resolveOrderingDirection(RELATION_NONE)).toEqual({ kind: 'resolved', value: { kind: 'ascending' } });
  });

  it('uses closed date vocabularies and never defaults unknown methods to today/date', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryDatePart(createMethodName('whereMonth'))).toEqual({ kind: 'resolved', value: { kind: 'month' } });
    expect(queryProducerSemanticAlgebra.resolveQueryDatePart(createMethodName('whereMystery'))).toEqual({ kind: 'not_applicable' });
    expect(queryProducerSemanticAlgebra.resolveQueryDateRelative(createMethodName('wherePast'))).toEqual({ kind: 'resolved', value: { kind: 'past' } });
    expect(queryProducerSemanticAlgebra.resolveQueryDateRelative(createMethodName('whereMystery'))).toEqual({ kind: 'not_applicable' });
  });

  it('keeps not_applicable exclusive to methods with no upstream rule owner', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereMystery'),
      arguments: [stringExpression('status')],
    })).toEqual({ kind: 'not_applicable', rule: { kind: 'unclaimed_query_operation_rule' } });
  });

  it('dispatches owned query operations through one rule-carrying interface decision', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('where'),
      arguments: [stringExpression('status'), stringExpression('active')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_basic_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'where' } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('joinSub'),
      arguments: [stringExpression('select 1')],
    })).toMatchObject({
      kind: 'malformed',
      rule: { kind: 'query_join_rule' },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereBetween'),
      arguments: [stringExpression('age')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_range_condition_rule' } });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereIn'),
      arguments: [stringExpression('status')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_membership_condition_rule' } });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereNull'),
      arguments: [stringExpression('deleted_at')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_null_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'where', condition: { kind: 'null' } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereBetween'),
      arguments: [stringExpression('age'), arrayExpression([stringExpression('18'), stringExpression('65')])],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_range_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'where', condition: { kind: 'between', negated: false } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereNotIn'),
      arguments: [stringExpression('status'), arrayExpression([stringExpression('deleted')])],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_membership_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'in', negated: true } } },
    });
  });

  it('resolves column-range, value-range, and null-safe equality through upstream rule authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereBetweenColumns'),
      arguments: [stringExpression('age'), arrayExpression([stringExpression('minimum_age'), stringExpression('maximum_age')])],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_column_range_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'where', condition: { kind: 'between_columns', negated: false } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereValueNotBetween'),
      arguments: [stringExpression('score'), arrayExpression([stringExpression('minimum_score'), stringExpression('maximum_score')])],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_value_range_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'value_between', negated: true } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereNullSafeEquals'),
      arguments: [stringExpression('external_id'), stringExpression('abc')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_null_safe_equality_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'null_safe_equals' } } },
    });
  });

  it('rejects malformed evidence for known column-range and null-safe equality rules', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereBetweenColumns'),
      arguments: [stringExpression('age'), arrayExpression([stringExpression('minimum_age')])],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_column_range_condition_rule' } });
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereNullSafeEquals'),
      arguments: [stringExpression('external_id')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_null_safe_equality_rule' } });
  });

  it('resolves date-part and relative-date predicates through the upstream operation authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereMonth'),
      arguments: [stringExpression('created_at'), stringExpression('2')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_date_part_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'date_part', part: { kind: 'month' }, operator: { kind: 'equal' } } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereDate'),
      arguments: [stringExpression('created_at'), stringExpression('mystery_operator'), stringExpression('2026-10-10')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_date_part_condition_rule' } });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWherePast'),
      arguments: [stringExpression('created_at')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_date_relative_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'date_relative', part: { kind: 'past' } } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereFuture'),
      arguments: [],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_date_relative_condition_rule' } });
  });


  it('resolves exists predicates through the existing upstream operation authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereNotExists'),
      arguments: [stringExpression('subquery evidence')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_exists_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'exists', negated: true } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereExists'),
      arguments: [],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_exists_condition_rule' } });
  });

  it('resolves LIKE predicate junction and polarity through the existing semantic authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereNotLike'),
      arguments: [stringExpression('email'), stringExpression('%@example.com'), stringExpression('case-sensitive')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_like_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'like', negated: { kind: 'negated' }, caseSensitive: { kind: 'case_sensitive' } } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereLike'),
      arguments: [stringExpression('email')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_like_condition_rule' } });
  });

  it('resolves full-text predicates through the existing upstream interface authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereFullText'),
      arguments: [stringExpression('body'), stringExpression('compiler interface')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_full_text_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'full_text', value: stringExpression('compiler interface') } } },
    });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereFullText'),
      arguments: [stringExpression('body')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_full_text_condition_rule' } });
  });

  it('resolves row-value predicates through the existing upstream interface authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereRowValues'),
      arguments: [arrayExpression([stringExpression('first_name'), stringExpression('last_name')]), stringExpression('>='), arrayExpression([stringExpression('Ada'), stringExpression('Lovelace')])],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_row_value_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'row_values', operator: { kind: 'greater_equal' } } } },
    });
  });

  it('rejects malformed row-value evidence at the upstream semantic boundary', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereRowValues'),
      arguments: [arrayExpression([stringExpression('first_name')]), stringExpression('mystery_operator'), arrayExpression([stringExpression('Ada')])],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_row_value_condition_rule' } });

    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereRowValues'),
      arguments: [arrayExpression([]), stringExpression('='), arrayExpression([])],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_row_value_condition_rule' } });
  });

  it('rejects an unsupported basic where operator instead of defaulting to equality', () => {
    const judgment = queryProducerSemanticAlgebra.resolveQueryBasicOperation(createMethodName('where'), [
      stringExpression('status'),
      stringExpression('mystery_operator'),
      stringExpression('active'),
    ]);
    expect(judgment).toMatchObject({
      kind: 'malformed',
      diagnostic: {
        kind: 'query_semantic_diagnostic',
        message: { kind: 'description_text', value: 'unsupported where operator: mystery_operator' },
      },
    });
  });

  it('rejects a known subquery join when its required alias evidence is missing', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryJoin(createMethodName('joinSub'), [stringExpression('select 1')])).toMatchObject({
      kind: 'malformed',
      diagnostic: { kind: 'query_semantic_diagnostic', message: { kind: 'description_text', value: 'subquery and lateral joins require an alias argument' } },
    });
  });

  it('treats an absent relation-path argument as not applicable, not malformed source', () => {
    expect(queryProducerSemanticAlgebra.resolveRelationPath(RELATION_NONE)).toEqual({ kind: 'not_applicable' });
  });

  it('does not manufacture a join for an unknown query method', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryJoin(createMethodName('mysteryJoin'), [])).toEqual({
      kind: 'not_applicable',
    });
  });

  it('projects a closed judgment to the legacy relation option only at the wiring boundary', () => {
    expect(queryProducerSemanticAlgebra.toLegacyOption({ kind: 'resolved', value: { kind: 'count' } })).toEqual({
      kind: 'some',
      value: { kind: 'count' },
    });
    expect(queryProducerSemanticAlgebra.toLegacyOption({ kind: 'not_applicable' })).toEqual({ kind: 'none' });
    expect(queryProducerSemanticAlgebra.toLegacyOption({ kind: 'malformed', diagnostic: { kind: 'query_semantic_diagnostic', message: { kind: 'description_text', value: 'bad evidence' } } })).toEqual({ kind: 'none' });
  });
  it('resolves column comparisons through the existing upstream operation authority', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('orWhereColumn'),
      arguments: [stringExpression('users.created_at'), stringExpression('>'), stringExpression('posts.created_at')],
    })).toMatchObject({
      kind: 'resolved',
      rule: { kind: 'query_column_comparison_condition_rule' },
      operation: { kind: 'instance', operation: { kind: 'or_where', condition: { kind: 'column', comparison: { operator: { kind: 'greater' } } } } },
    });
  });

  it('rejects malformed column comparison evidence upstream instead of falling back to scanner classification', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereColumn'),
      arguments: [stringExpression('users.id'), stringExpression('mystery_operator'), stringExpression('posts.user_id')],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_column_comparison_condition_rule' } });
    expect(queryProducerSemanticAlgebra.resolveQueryOperation({
      methodName: createMethodName('whereColumn'), arguments: [arrayExpression([])],
    })).toMatchObject({ kind: 'malformed', rule: { kind: 'query_column_comparison_condition_rule' } });
  });

});


describe('interface-owned query semantic model', () => {
  it('resolves method ownership through the existing semantic interface without executing a rule', () => {
    expect(queryProducerSemanticAlgebra.resolveQueryOperationRule(createMethodName('whereJsonContains'))).toMatchObject({
      kind: 'claimed',
      contract: {
        rule: 'query_json_condition_rule',
        methods: expect.arrayContaining(['whereJsonContains']),
      },
    });
    expect(queryProducerSemanticAlgebra.resolveQueryOperationRule(createMethodName('whereMystery'))).toEqual({
      kind: 'unclaimed',
      rule: { kind: 'unclaimed_query_operation_rule' },
    });
  });

  it('exposes the same authoritative rule declarations used by query-operation resolution', () => {
    expect(queryProducerSemanticAlgebra.queryOperationRules.length).toBeGreaterThan(0);
    expect(queryProducerSemanticAlgebra.queryOperationRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'query_basic_condition_rule',
          methods: expect.arrayContaining(['where', 'orWhere']),
          conclusion: { kind: 'query_operation_ast', family: 'query_basic_condition_rule' },
        }),
      ]),
    );
  });
});

describe('declarative query semantic rule catalog integrity', () => {
  const declaration = (
    rule: 'query_basic_condition_rule' | 'query_join_rule',
    methods: readonly string[],
  ): QueryOperationSemanticRuleDeclaration => ({
    rule,
    methods,
    evidence: { kind: 'query_operation_evidence', fields: ['methodName', 'arguments'] },
    premises: queryOperationSemanticRuleRequirements[rule].premises,
    constraints: queryOperationSemanticRuleRequirements[rule].constraints,
    conclusion: { kind: 'query_operation_ast', family: rule },
    outcomes: ['resolved', 'malformed', 'undetermined'],
  });

  it('accepts complete declarations with unique method ownership', () => {
    expect(validateQueryOperationSemanticRuleCatalog([
      declaration('query_basic_condition_rule', ['where']),
      declaration('query_join_rule', ['join']),
    ])).toEqual({ kind: 'valid', methodCount: 2, ruleCount: 2 });
  });

  it('rejects a method claimed by multiple semantic rules', () => {
    expect(validateQueryOperationSemanticRuleCatalog([
      declaration('query_basic_condition_rule', ['where']),
      declaration('query_join_rule', ['where']),
    ])).toMatchObject({
      kind: 'invalid',
      violations: [{ kind: 'duplicate_method_claim', method: 'where' }],
    });
  });

  it('rejects declarations that omit premises or constraints', () => {
    expect(validateQueryOperationSemanticRuleCatalog([{
      ...declaration('query_basic_condition_rule', ['where']),
      premises: [],
      constraints: [],
    }])).toMatchObject({
      kind: 'invalid',
      violations: [
        { kind: 'missing_premise', rule: 'query_basic_condition_rule' },
        { kind: 'missing_constraint', rule: 'query_basic_condition_rule' },
      ],
    });
  });

  it('rejects a rule declaration that omits family-specific semantic obligations', () => {
    const complete = declaration('query_basic_condition_rule', ['where']);
    expect(validateQueryOperationSemanticRuleCatalog([{
      ...complete,
      premises: ['method_vocabulary_claimed', 'argument_shape_valid'],
      constraints: ['arity'],
    }])).toMatchObject({
      kind: 'invalid',
      violations: expect.arrayContaining([
        { kind: 'missing_rule_obligation', rule: 'query_basic_condition_rule', obligation: 'premise', name: 'property_or_relation_evidence_resolved' },
        { kind: 'missing_rule_obligation', rule: 'query_basic_condition_rule', obligation: 'constraint', name: 'property_identity' },
      ]),
    });
  });
});
