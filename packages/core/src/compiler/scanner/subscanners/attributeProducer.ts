import type { AttributeAst } from '../../../types/upstream/ast';
import type { AttributeDefinition } from '../../../types/upstream/application';
import type { Sequence } from '../../../types/upstream/collections';
import type { ClosureParameter, Expression } from '../../../types/upstream/expression';
import { createClassName } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { ControllerDeclarationAst, ControllerMethodAst } from '../lexer/controllerAstTypes';
import type { PhpParameterTypeAst } from '../lexer/phpMethodAstTypes';
import { expressionFromPhpAst } from './expressionProducer';
import { resolveClosureBody } from './resource/resourceUpstreamExpressionClosure';
import { relationAny, relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationFoldRight, relationGate, relationFirst, relationOptionFold, relationProject } from '../../../semantic/kernel/relationalSequence';

/**
 * Syntax and provenance required to produce the canonical attribute AST.
 *
 * File discovery, tokenization, and declaration parsing remain scanner work.
 * The producer owns selecting `__construct` and lowering the constructor into
 * the high-level attribute contract.
 */
export type AttributeProducerInput = {
  readonly declaration: ControllerDeclarationAst;
  readonly source: SourceSpan;
  readonly contextual?: boolean;
};

export interface AttributeProducer {
  readonly produce: (input: AttributeProducerInput) => AttributeAst;
}

const sequence = <T>(items: readonly T[]): Sequence<T> =>
  relationFoldRight(items, { kind: 'empty' } as Sequence<T>, (head, tail) => ({ kind: 'cons', head, tail }));

const sourceAtLine = (source: SourceSpan, line: number): SourceSpan => ({
  kind: 'source_span',
  file: source.file,
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

const primitiveParameterTypes: readonly (readonly [string, TypeExpression])[] = Object.freeze([
  ['bool', { kind: 'primitive', value: { kind: 'boolean' } }],
  ['string', { kind: 'primitive', value: { kind: 'string' } }],
  ['int', { kind: 'primitive', value: { kind: 'number' } }],
  ['float', { kind: 'primitive', value: { kind: 'number' } }],
  ['mixed', { kind: 'mixed' }],
  ['array', { kind: 'primitive', value: { kind: 'unspecified' } }],
]);

const parameterType = (type: PhpParameterTypeAst): TypeExpression =>
  relationGate(relationEqual(type.kind, 'primitive'),
    () => {
      const primitive = type as Extract<PhpParameterTypeAst, { readonly kind: 'primitive' }>;
      return relationOptionFold(
        relationFirst(primitiveParameterTypes, entry => relationEqual(entry[0], primitive.name)),
        () => ({ kind: 'mixed' }),
        entry => entry[1],
      );
    },
    () => relationGate(relationEqual(type.kind, 'named'),
      () => {
        const named = type as Extract<PhpParameterTypeAst, { readonly kind: 'named' }>;
        return { kind: 'reference', value: { kind: 'class', name: createClassName(named.name) } };
      },
      () => {
        const nullable = type as Extract<PhpParameterTypeAst, { readonly kind: 'nullable' }>;
        return { kind: 'nullable', value: parameterType(nullable.inner) };
      }));

const closureParameter = (methodParameter: ControllerMethodAst['parameters'][number], file: string): ClosureParameter => ({
  kind: 'closure_parameter',
  name: { kind: 'variable_name', value: { kind: 'string_value', value: methodParameter.name } },
  type: { kind: 'present', value: parameterType(methodParameter.type) },
  passing: { kind: 'by_value' },
  variadic: { kind: 'fixed' },
  defaultValue: relationGate(relationEqual(methodParameter.defaultValue.kind, 'absent'),
    () => ({ kind: 'absent' }),
    () => ({ kind: 'present', value: expressionFromPhpAst(methodParameter.defaultValue.value, file) })),
});

const constructorExpression = (method: ControllerMethodAst, source: SourceSpan): Expression => {
  const methodSource = sourceAtLine(source, Number(method.source.line));
  return {
    kind: 'closure',
    value: {
      kind: 'closure',
      parameters: {
        kind: 'closure_parameters',
        items: sequence(relationProject(method.parameters, parameter => closureParameter(parameter, source.file.value.value))),
      },
      captures: { kind: 'closure_captures', items: { kind: 'empty' } },
      returnType: relationGate(relationEqual(method.declaredReturnType.kind, 'absent'),
        () => ({ kind: 'absent' }),
        () => ({ kind: 'present', value: parameterType(method.declaredReturnType.type) })),
      body: resolveClosureBody(method.body.statements, source.file.value.value, expressionFromPhpAst),
      source: methodSource,
    },
    source: methodSource,
  };
};

export const attributeProducer: AttributeProducer = {
  produce(input): AttributeAst {
    const constructor = relationFirst(input.declaration.methods, method => relationEqual(method.name, '__construct'));
    return relationOptionFold(constructor,
      () => { throw Error(`Attribute constructor not found: ${input.source.file.value.value}`); },
      constructorMethod => {
        const definition: AttributeDefinition = {
      kind: 'attribute',
      name: createClassName(input.declaration.className),
      file: input.source.file,
      constructor: constructorExpression(constructorMethod, input.source),
      contextual: relationEqual(input.contextual, true),
      source: input.source,
    };

        return {
          kind: 'attribute_ast',
          definition,
          source: input.source,
        };
      });
  },
};
