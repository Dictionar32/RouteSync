import { createDomainAstJudgment, type DtoAst } from '../../../types/upstream/ast';
import type { DtoDefinition, DtoMethods, DtoProperties, DtoProperty } from '../../../types/upstream/application';
import type { Sequence } from '../../../types/upstream/collections';
import { createClassName, createPropertyName } from '../../../types/upstream/names';
import type { PropertyDefinition } from '../../../types/upstream/property';
import type { Presence } from '../../../types/upstream/primitiveVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { DeclaredType, TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { PhpPropertyTypeAst, ResponseDtoDeclarationAst, ResponseDtoPropertyAst } from '../lexer/responseDtoAstTypes';

export type DtoProducerInput = {
  readonly declaration: ResponseDtoDeclarationAst;
  readonly source: SourceSpan;
};

export interface DtoProducer {
  readonly produce: (input: DtoProducerInput) => DtoAst;
}

const sequence = <T>(items: readonly T[]): Sequence<T> =>
  relationFoldRight(items, { kind: 'empty' } as Sequence<T>, (head, tail) => ({ kind: 'cons', head, tail }));

const sourceAtLine = (source: SourceSpan, line: number): SourceSpan => ({
  kind: 'source_span',
  file: source.file,
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

const primitiveTypeNames: readonly (readonly [string, TypeExpression])[] = Object.freeze([
  ['bool', { kind: 'primitive', value: { kind: 'boolean' } }],
  ['string', { kind: 'primitive', value: { kind: 'string' } }],
  ['int', { kind: 'primitive', value: { kind: 'number' } }],
  ['float', { kind: 'primitive', value: { kind: 'number' } }],
]);

const baseTypeExpression = (type: PhpPropertyTypeAst): TypeExpression =>
  relationGate(relationEqual(type.kind, 'primitive'),
    () => {
      const primitive = type as Extract<PhpPropertyTypeAst, { readonly kind: 'primitive' }>;
      return relationOptionFold(
        relationFirst(primitiveTypeNames, entry => relationEqual(entry[0], primitive.name)),
        () => ({ kind: 'primitive', value: { kind: 'number' } }),
        entry => entry[1],
      );
    },
    () => relationGate(relationEqual(type.kind, 'mixed'),
      () => ({ kind: 'mixed' }),
      () => {
        const named = type as Extract<PhpPropertyTypeAst, { readonly kind: 'named' }>;
        return { kind: 'reference', value: { kind: 'class', name: createClassName(named.name) } };
      }));

const typeExpression = (type: PhpPropertyTypeAst): TypeExpression =>
  relationGate(relationEqual(type.nullable, true),
    () => ({ kind: 'nullable', value: baseTypeExpression(type) }),
    () => baseTypeExpression(type));

const declared = (type: PhpPropertyTypeAst): DeclaredType => ({
  kind: 'declared_type',
  value: typeExpression(type),
  nullability: relationGate(relationEqual(type.nullable, true), () => ({ kind: 'nullable' }), () => ({ kind: 'non_nullable' })),
});

const property = (input: DtoProducerInput, item: ResponseDtoPropertyAst): DtoProperty => {
  const source = sourceAtLine(input.source, Number(item.source.line));
  const definition: PropertyDefinition = {
    kind: 'property',
    name: createPropertyName(item.name),
    type: typeExpression(item.type),
    presence: { kind: 'required' } satisfies Presence,
    declaration: {
      kind: 'class_property',
      owner: createClassName(input.declaration.className),
      role: { kind: 'dto_field' },
    },
    visibility: { kind: 'public' },
    storage: { kind: 'instance_mutable' },
    initialization: { kind: 'uninitialized' },
    promotion: { kind: 'declared' },
    access: { kind: 'read_write' },
    source,
  };
  return { kind: 'dto_property', property: definition, declared: declared(item.type), source };
};

export const dtoProducer: DtoProducer = {
  produce(input): DtoAst {
    const properties: DtoProperties = {
      kind: 'dto_properties',
      items: sequence(relationProject(input.declaration.properties, item => property(input, item))),
    };
    const methods: DtoMethods = { kind: 'dto_methods', items: sequence([]) };
    const definition: DtoDefinition = {
      kind: 'dto',
      name: createClassName(input.declaration.className),
      file: input.source.file,
      properties,
      methods,
      source: input.source,
    };
    return createDomainAstJudgment({ kind: 'dto_ast', semantic: definition, source: input.source });
  },
};
