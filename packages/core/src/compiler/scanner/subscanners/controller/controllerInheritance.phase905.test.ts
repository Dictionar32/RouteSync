import { describe, expect, it } from 'vitest';
import { parseControllerDeclaration } from '../../lexer/controllerDeclarationParser';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { createAstIdentifier } from '../../lexer/phpAstTypes';

describe('Phase 905 controller inheritance evidence', () => {
  it('preserves direct parent controller evidence', () => {
    const source = `<?php class AdminOrderController extends BaseOrderController implements HasMiddleware { public function show() {} }`;
    const declaration = parseControllerDeclaration(source, LaravelSourceLexer.tokenize(source), createAstIdentifier('AdminOrderController'), '<phase905>');
    expect(declaration.inheritance).toMatchObject({ kind: 'class', name: { value: 'BaseOrderController' } });
  });

  it('does not invent inheritance when no extends clause exists', () => {
    const source = `<?php class OrderController { public function show() {} }`;
    const declaration = parseControllerDeclaration(source, LaravelSourceLexer.tokenize(source), createAstIdentifier('OrderController'), '<phase905>');
    expect(declaration.inheritance).toEqual({ kind: 'none' });
  });
});
