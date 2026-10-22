import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LaravelSourceLexer } from '../../core/src/compiler/scanner/LaravelSourceLexer';
import { createAstIdentifier } from '../../core/src/compiler/scanner/lexer/phpAstTypes';
import { attributeProducer } from '../../core/src/compiler/scanner/attributeProducer';
import { laravelAttributeScanner } from '../../core/src/compiler/scanner/laravelAttributeScanner';
import type { LaravelAttributeContextualityJudgment } from '../../core/src/types/upstream/laravelAttributeScannerInterface';
import type { Sequence } from '../../core/src/types/upstream/collections';
import type { SourceProjectIdentity } from '../../core/src/types/upstream/highLevelSourceModel';
import type { SourceSpan } from '../../core/src/types/upstream/provenance';

const fixtureRoot = path.resolve(__dirname, 'fixtures/ecommerce-shop-source');
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
      { kind: 'syntax_only' },
    );
    const declarationSource = source(fixtureFile, Number(declaration.source.line));
    const contextuality: LaravelAttributeContextualityJudgment = {
      kind: 'laravel_attribute_non_contextual_declaration',
      closed: true,
      qualifiedIdentity: declaration.classIdentity,
      source: declarationSource,
      interfaceInventory: {
        kind: 'laravel_attribute_resolved_interface_inventory',
        closed: true,
        declarationSource,
        entries: { kind: 'laravel_attribute_resolved_interface_sequence_empty' },
      },
    };
    const judgment = attributeProducer.produce({ declaration, source: declarationSource, contextuality });
    expect(judgment.kind).toBe('attribute_producer_complete');
    if (judgment.kind === 'attribute_producer_blocked') return;
    const attribute = judgment.attribute;
    const constructor = attribute.definition.constructor;

    expect(attribute).toMatchObject({
      kind: 'attribute_ast',
      definition: {
        kind: 'attribute',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'Response' } },
        file: { kind: 'source_file', value: { kind: 'string_value', value: fixtureFile } },
      },
      source: declarationSource,
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
    expect(constructor.source.start.value.value).toBe(Number(declaration.methods.find(method => method.name === '__construct')?.source.line));
  });

  it('routes discovered attribute syntax through attributeProducer into SourceAsts-compatible AttributeAst values', async () => {
    const scan = await laravelAttributeScanner.scan(project(fixtureRoot));

    expect(scan.kind).toBe('laravel_attribute_scan_complete');
    if (scan.kind === 'laravel_attribute_scan_blocked') return;
    const files = scan.discoveryReceipt.files;
    expect(files.kind).toBe('laravel_attribute_scanned_file_sequence_entry');
    if (files.kind === 'laravel_attribute_scanned_file_sequence_empty') return;
    expect(files.evidence.attribute).toMatchObject({
      kind: 'attribute_ast',
      definition: {
        kind: 'attribute',
        name: { kind: 'class_name', value: { kind: 'string_value', value: 'Response' } },
      },
    });
  });

  it('blocks a missing app/Attributes scope instead of publishing an empty complete inventory', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'routesync-attribute-scope-'));
    try {
      const scan = await laravelAttributeScanner.scan(project(root));
      expect(scan.kind).toBe('laravel_attribute_scan_blocked');
      if (scan.kind === 'laravel_attribute_scan_complete') return;
      expect(scan.blockers.kind).toBe('laravel_attribute_scan_failure_sequence_end');
      if (scan.blockers.kind === 'laravel_attribute_scan_failure_sequence_entry') return;
      expect(scan.blockers.failure.kind).toBe('laravel_attribute_discovery_scope_missing');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
