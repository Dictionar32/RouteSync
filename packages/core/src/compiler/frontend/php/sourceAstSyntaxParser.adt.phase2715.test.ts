import { describe, expect, it } from 'vitest';
import { sourceAstSyntaxParser } from './sourceAstSyntaxParser';
import type { SourceAstFileEvidence } from '../../../types/upstream/sourceAstEvidenceAcquisitionInterface';

const modelSource: SourceAstFileEvidence = Object.freeze({
  kind: 'source_ast_file_evidence',
  sourceKind: 'model',
  path: '/app/Models/User.php',
  text: '<?php class User { public string $name; protected int $age = 3; }',
  closed: true,
});

describe('sourceAstSyntaxParser AST ADT contract (phase2715)', () => {
  it('returns explicitly discriminated, closed syntax parse evidence', () => {
    const result = sourceAstSyntaxParser.parse([modelSource]);

    expect(result.kind).toBe('source_ast_syntax_parse');
    expect(result.closed).toBe(true);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.kind).toBe('source_ast_parsed_file');
    expect(result.files[0]?.closed).toBe(true);
    expect(result.files[0]?.owner).toBe('User');
    expect(result.files[0]?.properties).toHaveLength(2);
    expect(result.files[0]?.properties.every((property) => property.kind === 'class_property')).toBe(true);
  });

  it('parses properties through the frontend-owned interface operation', () => {
    const properties = sourceAstSyntaxParser.parseProperties(modelSource.text);

    expect(properties).toHaveLength(2);
    expect(properties.every((property) => property.kind === 'class_property')).toBe(true);
  });
});
