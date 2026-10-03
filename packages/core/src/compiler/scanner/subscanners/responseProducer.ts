import { createDomainAstJudgment, type ResponseAst } from '../../../types/upstream/ast';
import type { ResponseDtoDeclarationAst, PhpPropertyTypeAst } from '../lexer/responseDtoAstTypes';
import type { ControllerMethodAst } from '../lexer/controllerAstTypes';
import { controllerReturnSemanticFromMethod } from './controller/controllerAstCanonical';
import type { ControllerReturnSemantic } from '../../../types/upstream/controller';
import type { ResponseResult, ResponseStatus } from '../../../types/upstream/response';
import { createResponseTypeName } from '../../../types/upstream/names';
import type { Sequence } from '../../../types/upstream/collections';
import type { TypeExpression, TypeProperty } from '../../../types/upstream/typeVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { Lookup } from '../../../types/upstream/collections';
import type { HttpStatusCode, StringValue } from '../../../types/upstream/valueObjects';
import { createPropertyName } from '../../../types/upstream/names';
import { relationEqual, relationGate } from '../../../semantic/kernel/semanticRelations';
import { relationLookup, relationOptionFold, relationProject, relationNone, relationSome } from '../../../semantic/kernel/relationalSequence';

export type ResponseProducerInput =
  | { readonly kind: 'dto'; readonly declaration: ResponseDtoDeclarationAst; readonly source: SourceSpan }
  | { readonly kind: 'controller'; readonly method: ControllerMethodAst; readonly source: SourceSpan };

export interface ResponseProducer {
  readonly produce: (input: ResponseProducerInput) => ResponseAst;
}

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[], index = items.length - 1, tail: Sequence<T> = { kind: 'empty' }): Sequence<T> => relationGate(index < 0, () => tail, () => sequence(items, index - 1, { kind: 'cons', head: items[index], tail }));

type PrimitiveName = Extract<PhpPropertyTypeAst, { readonly kind: 'primitive' }>['name'];
const primitiveTypeCatalog: readonly (readonly [PrimitiveName, TypeExpression])[] = Object.freeze([
  ['bool', { kind: 'primitive', value: { kind: 'boolean' } }],
  ['int', { kind: 'primitive', value: { kind: 'number' } }],
  ['float', { kind: 'primitive', value: { kind: 'number' } }],
  ['string', { kind: 'primitive', value: { kind: 'string' } }],
]);
const primitiveType = (name: PrimitiveName): TypeExpression => relationLookup(primitiveTypeCatalog, name);

type TypeResolution = (type: PhpPropertyTypeAst) => TypeExpression;
const typeCatalog: readonly (readonly [PhpPropertyTypeAst['kind'], TypeResolution])[] = Object.freeze([
  ['primitive', type => primitiveType(type.name)],
  ['mixed', () => ({ kind: 'mixed' } as TypeExpression)],
  ['named', type => ({ kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } } as TypeExpression)],
]);
function typeExpression(type: PhpPropertyTypeAst): TypeExpression {
  const value = relationOptionFold(relationLookup(typeCatalog, type.kind), () => ({ kind: 'mixed' } as TypeExpression), resolver => resolver(type));
  return relationGate(relationEqual(type.nullable, true), () => ({ kind: 'nullable', value }), () => value);
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
  const properties: readonly TypeProperty[] = relationProject(declaration.properties, property => ({
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
  const definition: ResponseAst['definition'] = {
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
    }
  return createDomainAstJudgment({ kind: 'response_ast', semantic: definition, source });
}

function controllerResponse(method: ControllerMethodAst, source: SourceSpan): ResponseAst {
  const returned = controllerReturnSemanticFromMethod(
    method,
    source.file.value.value,
    { kind: 'response_present', response: { kind: 'response_reference', name: createResponseTypeName(`${String(method.name)}Response`) } },
  );
  const result = responseResultFromReturn(returned);
  const output: TypeExpression = { kind: 'mixed' };
  const definition: ResponseAst['definition'] = {
      kind: 'response',
      typeName: createResponseTypeName(`${String(method.name)}Response`),
      output,
      transport: emptyTransport(),
      outcome: relationGate(relationEqual(result.kind, 'missing'),
        () => ({ kind: 'success', result: { kind: 'content', body: { kind: 'empty' }, status: frameworkStatus() } }),
        () => ({ kind: 'success', result: result.value })),
      source,
    }
  return createDomainAstJudgment({ kind: 'response_ast', semantic: definition, source });
}

function frameworkStatus(): ResponseStatus {
  return { kind: 'response_status', value: defaultStatus, origin: { kind: 'framework_default' } };
}

type ReturnResolution = (returned: ControllerReturnSemantic) => Lookup<ResponseResult>;
const responseResultCatalog: readonly (readonly [ControllerReturnSemantic['kind'], ReturnResolution])[] = Object.freeze([
  ['absent', () => ({ kind: 'missing' })],
  ['response', returned => ({ kind: 'found', value: returned.result })],
  ['resource', returned => ({ kind: 'found', value: {
    kind: 'resource',
    resource: returned.resource,
    model: {
      kind: 'model_reference',
      name: relationGate(relationEqual(returned.model.kind, 'model_class'), () => returned.model.name, () => ({ kind: 'model_name', value: { kind: 'string_value', value: returned.model.name.value } })),
    },
    cardinality: returned.cardinality,
    status: frameworkStatus(),
  } })],
  ['model', returned => ({ kind: 'found', value: {
    kind: 'content',
    body: { kind: 'json', shape: { kind: 'single', payload: { kind: 'model', model: { kind: 'model_reference', name: relationGate(relationEqual(returned.model.kind, 'model_class'), () => returned.model.name, () => ({ kind: 'model_name', value: { kind: 'string_value', value: returned.model.name.value } })) } } } },
    status: frameworkStatus(),
  } })],
  ['expression', returned => ({ kind: 'found', value: {
    kind: 'content',
    body: { kind: 'json', shape: { kind: 'single', payload: { kind: 'expression', expression: returned.expression } } },
    status: frameworkStatus(),
  } })],
  ['branches', returned => ({ kind: 'found', value: {
    kind: 'branches',
    branches: sequence(foundBranchResults(returned.branches)),
  } })],
]);
const responseResultFromReturn = (returned: ControllerReturnSemantic): Lookup<ResponseResult> => relationOptionFold(
  relationLookup(responseResultCatalog, returned.kind),
  () => ({ kind: 'missing' }),
  resolver => resolver(returned),
);


function foundBranchResults(branches: Sequence<ControllerReturnSemantic>, output: ResponseResult[] = []): readonly ResponseResult[] {
  return relationGate(relationEqual(branches.kind, 'empty'), () => output, () => {
    const resolved = responseResultFromReturn(branches.head);
    return relationOptionFold(
      relationGate(relationEqual(resolved.kind, 'found'), () => relationSome(resolved.value), () => relationNone()),
      () => foundBranchResults(branches.tail, output),
      value => foundBranchResults(branches.tail, output.concat([value])),
    );
  });
}



type ProducerResolution<K extends ResponseProducerInput['kind']> = (input: Extract<ResponseProducerInput, { readonly kind: K }>) => ResponseAst;
const producerRule = <K extends ResponseProducerInput['kind']>(kind: K, resolve: ProducerResolution<K>): readonly [K, (input: ResponseProducerInput) => ResponseAst] => [
  kind,
  input => resolve(input as Extract<ResponseProducerInput, { readonly kind: K }>),
];
const producerCatalog: readonly (readonly [ResponseProducerInput['kind'], (input: ResponseProducerInput) => ResponseAst])[] = Object.freeze([
  producerRule('dto', input => dtoResponse(input.declaration, input.source)),
  producerRule('controller', input => controllerResponse(input.method, input.source)),
]);
const producerResolution = (input: ResponseProducerInput): ResponseAst => relationOptionFold(
  relationLookup(producerCatalog, input.kind),
  () => { throw Error(`Unsupported response producer input: ${input.kind}`); },
  resolver => resolver(input),
);
export const responseProducer: ResponseProducer = { produce: producerResolution };
