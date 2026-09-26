import type { AttributeAst } from '../../../types/upstream/ast';
import type { AttributeDefinition } from '../../../types/upstream/application';
import type { Sequence } from '../../../types/upstream/collections';
import type { ClosureParameter, Expression } from '../../../types/upstream/expression';
import { createClassName } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { ControllerDeclarationAst, ControllerMethodAst } from '../lexer/controllerAstTypes';
import type { PhpParameterTypeAst } from '../lexer/phpMethodAstTypes';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';
import { mapClosureBody } from './resource/resourceUpstreamExpressionClosure';

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
};

export interface AttributeProducer {
  readonly produce: (input: AttributeProducerInput) => AttributeAst;
}

const sequence = <T>(items: readonly T[]): Sequence<T> =>
  items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

const sourceAtLine = (source: SourceSpan, line: number): SourceSpan => ({
  kind: 'source_span',
  file: source.file,
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

const parameterType = (type: PhpParameterTypeAst): TypeExpression => {
  switch (type.kind) {
    case 'primitive':
      switch (type.name) {
        case 'bool': return { kind: 'primitive', value: { kind: 'boolean' } };
        case 'string': return { kind: 'primitive', value: { kind: 'string' } };
        case 'int':
        case 'float': return { kind: 'primitive', value: { kind: 'number' } };
        case 'mixed': return { kind: 'mixed' };
        case 'array': return { kind: 'primitive', value: { kind: 'unspecified' } };
      }
    case 'named': return { kind: 'reference', value: { kind: 'class', name: createClassName(type.name) } };
    case 'nullable': return { kind: 'nullable', value: parameterType(type.inner) };
  }
};

const closureParameter = (methodParameter: ControllerMethodAst['parameters'][number], file: string): ClosureParameter => ({
  kind: 'closure_parameter',
  name: { kind: 'variable_name', value: { kind: 'string_value', value: methodParameter.name } },
  type: { kind: 'present', value: parameterType(methodParameter.type) },
  passing: { kind: 'by_value' },
  variadic: { kind: 'fixed' },
  defaultValue: methodParameter.defaultValue.kind === 'absent'
    ? { kind: 'absent' }
    : { kind: 'present', value: mapResourcePhpAstToUpstream(methodParameter.defaultValue.value, file) },
});

const constructorExpression = (method: ControllerMethodAst, source: SourceSpan): Expression => {
  const methodSource = sourceAtLine(source, Number(method.source.line));
  return {
    kind: 'closure',
    value: {
      kind: 'closure',
      parameters: {
        kind: 'closure_parameters',
        items: sequence(method.parameters.map(parameter => closureParameter(parameter, source.file.value.value))),
      },
      captures: { kind: 'closure_captures', items: { kind: 'empty' } },
      returnType: method.declaredReturnType.kind === 'absent'
        ? { kind: 'absent' }
        : { kind: 'present', value: parameterType(method.declaredReturnType.type) },
      body: mapClosureBody(method.body.statements, source.file.value.value, mapResourcePhpAstToUpstream),
      source: methodSource,
    },
    source: methodSource,
  };
};

export const attributeProducer: AttributeProducer = {
  produce(input): AttributeAst {
    const constructor = input.declaration.methods.find(method => method.name === '__construct');
    if (!constructor) throw new Error(`Attribute constructor not found: ${input.source.file.value.value}`);

    const definition: AttributeDefinition = {
      kind: 'attribute',
      name: createClassName(input.declaration.className),
      file: input.source.file,
      constructor: constructorExpression(constructor, input.source),
      source: input.source,
    };

    return {
      kind: 'attribute_ast',
      definition,
      source: input.source,
    };
  },
};
