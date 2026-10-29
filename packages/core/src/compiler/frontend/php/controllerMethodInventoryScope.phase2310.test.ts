import { describe, expect, it } from 'vitest';
import { createAstIdentifier } from './phpAstTypes';
import { controllerDeclarationParser } from './controllerDeclarationParser';
import { phpSourceTokenizer } from './tokenizer';

describe('Phase 2310 controller method inventory scope', () => {
  it('enumerates direct methods from the selected class only', () => {
    const source = '<?php class FirstController { public function index() { function nestedHelper() {} return []; } public function show() {} } class OtherController { public function destroy() {} }';
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('FirstController'));

    expect(declaration.methodDeclarationInventory.kind).toBe('controller_method_declaration_inventory_complete');
    expect(declaration.methods.map(method => method.name)).toEqual(['index', 'show']);
  });

  it('blocks inventory closure when the class body has no matching closing brace', () => {
    const source = '<?php class FirstController { public function index() {}';
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('FirstController'));

    expect(declaration.methodDeclarationInventory.kind).toBe('controller_method_declaration_inventory_blocked');
    expect(declaration.methods).toEqual([]);
  });
});
