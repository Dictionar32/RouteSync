import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import * as path from 'node:path';
import { readSourceText } from './scannerUtils';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { parseResponseDtoDeclaration } from '../lexer/responseDtoDeclarationParser';
import { collectPhpFiles } from './scannerUtils';
import type { DtoAst } from '../../../types/upstream/ast';
import type { DtoDefinition, DtoProperty, DtoProperties, DtoMethods } from '../../../types/upstream/application';
import type { DeclaredType, TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { PropertyDefinition } from '../../../types/upstream/property';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { StringValue } from '../../../types/upstream/valueObjects';
import type { Presence } from '../../../types/upstream/primitiveVocabulary';
import type { Sequence } from '../../../types/upstream/collections';
import type { PhpPropertyTypeAst, ResponseDtoPropertyAst } from '../lexer/responseDtoAstTypes';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const source = (file: string, line: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: stringValue(file) }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } });

function typeExpression(type: PhpPropertyTypeAst): TypeExpression {
  const base: TypeExpression = (() => {
    switch (type.kind) {
      case 'primitive':
        return { kind: 'primitive', value: type.name === 'bool' ? { kind: 'boolean' } : type.name === 'string' ? { kind: 'string' } : { kind: 'number' } };
      case 'mixed':
        return { kind: 'mixed' };
      case 'named':
        return { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: stringValue(type.name) } } };
    }
  })();
  return type.kind === 'primitive' && type.nullable || type.kind === 'named' && type.nullable ? { kind: 'nullable', value: base } : base;
}

function declared(type: PhpPropertyTypeAst): DeclaredType {
  const value = typeExpression(type);
  return { kind: 'declared_type', value, nullability: type.nullable ? { kind: 'nullable' } : { kind: 'non_nullable' } };
}

function property(file: string, item: ResponseDtoPropertyAst): DtoProperty {
  const span = source(file, Number(item.source.line));
  const definition: PropertyDefinition = {
    kind: 'property',
    name: { kind: 'property_name', value: stringValue(item.name) },
    type: typeExpression(item.type),
    presence: { kind: 'required' } satisfies Presence,
    origin: { kind: 'computed' },
    source: span,
  };
  return { kind: 'dto_property', property: definition, declared: declared(item.type), source: span };
}

export async function scanDtoAsts(sourceProject: SourceProjectIdentity): Promise<readonly DtoAst[]> {
    const sourceRoot = sourceProject.root.value.value;
  const directory = path.join(sourceRoot, 'app', 'Http', 'DTOs');
  const files = await collectPhpFiles(directory);
  const asts: DtoAst[] = [];
  for (const file of files) {
    const text = await readSourceText(file);
    const tokens = LaravelSourceLexer.tokenize(text);
    const classToken = tokens.find((token, index) => token.value === 'class' && tokens[index + 1]);
    if (!classToken) throw new Error(`DTO class declaration not found: ${file}`);
    const className = createAstIdentifier(tokens[tokens.indexOf(classToken) + 1].value);
    const declaration = parseResponseDtoDeclaration(tokens, className);
    const span = source(file, Number(declaration.source.line));
    const properties: DtoProperties = { kind: 'dto_properties', items: sequence(declaration.properties.map(item => property(file, item))) };
    const methods: DtoMethods = { kind: 'dto_methods', items: sequence([]) };
    const definition: DtoDefinition = {
      kind: 'dto',
      name: { kind: 'class_name', value: stringValue(declaration.className) },
      file: { kind: 'source_file', value: stringValue(file) },
      properties,
      methods,
      source: span,
    };
    asts.push({ kind: 'dto_ast', definition, source: span });
  }
  return Object.freeze(asts);
}
