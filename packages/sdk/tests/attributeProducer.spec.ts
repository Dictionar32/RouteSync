import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LaravelSourceLexer } from '../../core/src/compiler/scanner/LaravelSourceLexer';
import { createAstIdentifier } from '../../core/src/compiler/scanner/lexer/phpAstTypes';
import { attributeProducer } from '../../core/src/compiler/scanner/subscanners/attributeProducer';
import { scanAttributeAsts } from '../../core/src/compiler/scanner/subscanners/attributeAstCanonical';
import type { Sequence } from '../../core/src/types/upstream/collections';
import type { SourceProjectIdentity } from '../../core/src/types/upstream/highLevelSourceModel';
import type { SourceSpan } from '../../core/src/types/upstream/provenance';

const fixtureRoot = path.resolve(__dirname, '../../..', 'examples/ecommerce-shop-source');
const fixtureFile = path.join(fixtureRoot, 'app/Attributes/Response.php');

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

describe('AttributeAst producer', () => {
  it('maps the ecommerce Response attribute declaration into the high-level constructor interface', async () => {
    const text = await readFile(fixtureFile, 'utf8');
    const tokens = LaravelSourceLexer.tokenize(text);
    const declaration = LaravelSourceLexer.parseControllerDeclaration(
      text,
      tokens,
      createAstIdentifier('Response'),
    );

    const attribute = attributeProducer.produce({
      declaration,
      source: source(fixtureFile, Number(declaration.source.line)),
    });
    const constructor = attribute.definition.constructor;

    expect(attribute).toMatchObject({
      kind: 'attribute_ast',
      definition: {
        kind: 'attribute',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'Response' } },
        file: { kind: 'source_file', value: { kind: 'string_value', value: fixtureFile } },
      },
      source: source(fixtureFile, 1),
    });
    expect(constructor.kind).toBe('closure');
    if (constructor.kind !== 'closure') throw new Error('Expected attribute constructor closure');
    const parameters = sequenceToArray(constructor.value.parameters.items);
    expect(parameters.map(parameter => parameter.name.value.value)).toEqual(['type', 'collection']);
    expect(parameters.map(parameter => parameter.type)).toEqual([
      { kind: 'present', value: { kind: 'primitive', value: { kind: 'string' } } },
      { kind: 'present', value: { kind: 'primitive', value: { kind: 'boolean' } } },
    ]);
    expect(parameters[1].defaultValue).toMatchObject({
      kind: 'present',
      value: { kind: 'literal', value: { kind: 'boolean_literal', value: { kind: 'truth_value', value: false } } },
    });
    expect(constructor.value.captures.items).toEqual({ kind: 'empty' });
    expect(constructor.value.returnType).toEqual({ kind: 'absent' });
    expect(constructor.source).toEqual(source(fixtureFile, 8));
  });

  it('routes discovered attribute syntax through attributeProducer into SourceAsts-compatible AttributeAst values', async () => {
    const attributes = await scanAttributeAsts(project(fixtureRoot));

    expect(attributes).toHaveLength(1);
    expect(attributes[0]).toMatchObject({
      kind: 'attribute_ast',
      definition: {
        kind: 'attribute',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'Response' } },
      },
    });
  });
});
