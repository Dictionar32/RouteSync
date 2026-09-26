import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LaravelSourceLexer } from '../../core/src/compiler/scanner/LaravelSourceLexer';
import { createAstIdentifier } from '../../core/src/compiler/scanner/lexer/phpAstTypes';
import { parseResponseDtoDeclaration } from '../../core/src/compiler/scanner/lexer/responseDtoDeclarationParser';
import { dtoProducer } from '../../core/src/compiler/scanner/subscanners/dtoProducer';
import { scanDtoAsts } from '../../core/src/compiler/scanner/subscanners/dtoAstCanonical';
import type { Sequence } from '../../core/src/types/upstream/collections';
import type { SourceProjectIdentity } from '../../core/src/types/upstream/highLevelSourceModel';
import type { SourceSpan } from '../../core/src/types/upstream/provenance';

const fixtureRoot = path.resolve(__dirname, '../../..', 'examples/ecommerce-shop-source');
const fixtureFile = path.join(fixtureRoot, 'app/Http/DTOs/RegisterResponse.php');

const sequenceToArray = <T>(items: Sequence<T>): readonly T[] => {
  const values: T[] = [];
  let current = items;
  while (current.kind === 'cons') {
    values.push(current.head);
    current = current.tail;
  }
  return values;
};

const source = (file: string, line: number): SourceSpan => ({
  kind: 'source_span',
  file: { kind: 'source_file', value: { kind: 'string_value', value: file } },
  start: { kind: 'number_value', value: line },
  end: { kind: 'number_value', value: line },
});

const project = (root: string): SourceProjectIdentity => ({
  kind: 'laravel_project',
  root: source(root, 1).file,
  source: source(root, 1),
});

describe('DtoAst producer', () => {
  it('maps the ecommerce RegisterResponse lexer ADT into a typed DtoAst with exact field provenance', async () => {
    const text = await readFile(fixtureFile, 'utf8');
    const tokens = LaravelSourceLexer.tokenize(text);
    const classTokenIndex = tokens.findIndex(token => token.value === 'class');
    const declaration = parseResponseDtoDeclaration(tokens, createAstIdentifier(tokens[classTokenIndex + 1].value));

    const dto = dtoProducer.produce({ declaration, source: source(fixtureFile, Number(declaration.source.line)) });
    const properties = sequenceToArray(dto.definition.properties.items);

    expect(dto).toMatchObject({
      kind: 'dto_ast',
      definition: {
        kind: 'dto',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'RegisterResponse' } },
        file: { kind: 'source_file', value: { kind: 'string_value', value: fixtureFile } },
      },
      source: source(fixtureFile, 1),
    });
    expect(properties.map(property => property.property.name.value.value)).toEqual(['success', 'message', 'data']);
    expect(properties.map(property => property.property.type)).toEqual([
      { kind: 'primitive', value: { kind: 'boolean' } },
      { kind: 'primitive', value: { kind: 'string' } },
      { kind: 'mixed' },
    ]);
    expect(properties.map(property => property.source.start.value)).toEqual([7, 8, 9]);
    expect(properties.map(property => property.declared.nullability)).toEqual([
      { kind: 'non_nullable' },
      { kind: 'non_nullable' },
      { kind: 'non_nullable' },
    ]);
  });

  it('routes discovered DTO syntax through dtoProducer into SourceAsts-compatible DtoAst values', async () => {
    const dtos = await scanDtoAsts(project(fixtureRoot));

    expect(dtos).toHaveLength(1);
    expect(dtos[0]).toMatchObject({
      kind: 'dto_ast',
      definition: {
        kind: 'dto',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'RegisterResponse' } },
      },
    });
  });
});
