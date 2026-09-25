import type { ResponseAst } from '../../../types/upstream/ast';
import type { ResponseDtoDeclarationAst, PhpPropertyTypeAst } from '../lexer/responseDtoAstTypes';
import type { ControllerMethodAst } from '../lexer/controllerAstTypes';
import { controllerReturnSemanticFromMethod } from './controller/controllerAstCanonical';
import type { ControllerReturnSemantic } from '../../../types/upstream/controller';
import type { ResponseResult, ResponseStatus } from '../../../types/upstream/response';
import { mapAstValueToExpression } from './resource/resourceAstExpressionMapper';
import { createResponseTypeName } from '../../../types/upstream/names';
import type { Sequence } from '../../../types/upstream/collections';
import type { TypeExpression, TypeProperty } from '../../../types/upstream/typeVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { HttpStatusCode, StringValue } from '../../../types/upstream/valueObjects';
import { createPropertyName } from '../../../types/upstream/names';

export type ResponseProducerInput =
  | { readonly kind: 'dto'; readonly declaration: ResponseDtoDeclarationAst; readonly source: SourceSpan }
  | { readonly kind: 'controller'; readonly method: ControllerMethodAst; readonly source: SourceSpan };

export interface ResponseProducer {
  readonly produce: (input: ResponseProducerInput) => ResponseAst;
}

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>(
  (tail, item) => ({ kind: 'cons', head: item, tail }),
  { kind: 'empty' },
);

function primitiveType(name: Extract<PhpPropertyTypeAst, { readonly kind: 'primitive' }>['name']): TypeExpression {
  switch (name) {
    case 'bool': return { kind: 'primitive', value: { kind: 'boolean' } };
    case 'int':
    case 'float': return { kind: 'primitive', value: { kind: 'number' } };
    case 'string': return { kind: 'primitive', value: { kind: 'string' } };
  }
}

function typeExpression(type: PhpPropertyTypeAst): TypeExpression {
  let value: TypeExpression;
  switch (type.kind) {
    case 'primitive': value = primitiveType(type.name); break;
    case 'mixed': value = { kind: 'mixed' }; break;
    case 'named': value = { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } }; break;
  }
  return type.nullable ? { kind: 'nullable', value } : value;
}

const defaultStatus: HttpStatusCode = {
  kind: 'http_status_code',
  value: { kind: 'number_value', value: 200 },
};

const emptyTransport = (): import('../../../types/upstream/response').ResponseTransport => ({
  kind: 'response_transport',
  headers: { kind: 'empty' },
  cookies: { kind: 'empty' },
});

function dtoResponse(declaration: ResponseDtoDeclarationAst, source: SourceSpan): ResponseAst {
  const properties: readonly TypeProperty[] = declaration.properties.map(property => ({
    kind: 'type_property',
    name: createPropertyName(property.name),
    type: typeExpression(property.type),
    source,
  }));
  const output: TypeExpression = {
    kind: 'object',
    properties: { kind: 'type_properties', items: sequence(properties) },
  };
  const status = {
    kind: 'response_status' as const,
    value: defaultStatus,
    origin: { kind: 'framework_default' as const },
  };
  return {
    kind: 'response_ast',
    definition: {
      kind: 'response',
      typeName: createResponseTypeName(declaration.className),
      output,
      transport: emptyTransport(),
      outcome: {
        kind: 'success',
        result: {
          kind: 'content',
          body: { kind: 'json', shape: { kind: 'single', payload: { kind: 'object', type: output } } },
          status,
        },
      },
      source,
    },
    source,
  };
}

function controllerResponse(method: ControllerMethodAst, source: SourceSpan): ResponseAst {
  const returned = controllerReturnSemanticFromMethod(
    method,
    source.file.value.value,
    { kind: 'response_present', response: { kind: 'response_reference', name: createResponseTypeName(`${String(method.name)}Response`) } },
  );
  const result = responseResultFromReturn(returned);
  const output: TypeExpression = { kind: 'mixed' };
  return {
    kind: 'response_ast',
    definition: {
      kind: 'response',
      typeName: createResponseTypeName(`${String(method.name)}Response`),
      output,
      transport: emptyTransport(),
      outcome: result === undefined ? { kind: 'success', result: { kind: 'content', body: { kind: 'empty' }, status: frameworkStatus() } } : { kind: 'success', result },
      source,
    },
    source,
  };
}

function frameworkStatus(): ResponseStatus {
  return { kind: 'response_status', value: defaultStatus, origin: { kind: 'framework_default' } };
}

function responseResultFromReturn(returned: ControllerReturnSemantic): ResponseResult | undefined {
  switch (returned.kind) {
    case 'absent': return undefined;
    case 'response': return returned.result;
    case 'resource': return {
      kind: 'resource',
      resource: returned.resource,
      model: {
        kind: 'model_reference',
        name: returned.model.kind === 'model_class' ? returned.model.name : { kind: 'model_name', value: { kind: 'string_value', value: returned.model.name.value } },
      },
      status: frameworkStatus(),
    };
    case 'model': return {
      kind: 'content',
      body: { kind: 'json', shape: { kind: 'single', payload: { kind: 'model', model: { kind: 'model_reference', name: returned.model.kind === 'model_class' ? returned.model.name : { kind: 'model_name', value: { kind: 'string_value', value: returned.model.name.value } } } } } },
      status: frameworkStatus(),
    };
    case 'expression': return {
      kind: 'content',
      body: { kind: 'json', shape: { kind: 'single', payload: { kind: 'expression', expression: returned.expression } } },
      status: frameworkStatus(),
    };
    case 'branches': {
      const branches = sequence(returned.branches.kind === 'empty' ? [] : sequenceToArray(returned.branches).map(responseResultFromReturn).filter((item): item is ResponseResult => item !== undefined));
      return { kind: 'branches', branches };
    }
  }
}

function sequenceToArray<T>(sequenceValue: Sequence<T>): readonly T[] {
  const items: T[] = [];
  let current = sequenceValue;
  while (current.kind === 'cons') {
    items.push(current.head);
    current = current.tail;
  }
  return items;
}

export const responseProducer: ResponseProducer = {
  produce: input => {
    switch (input.kind) {
      case 'dto': return dtoResponse(input.declaration, input.source);
      case 'controller': return controllerResponse(input.method, input.source);
    }
  },
};
