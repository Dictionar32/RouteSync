import { describe, expect, it } from 'vitest';
import { createAstIdentifier } from './phpAstTypes';
import { parseControllerDeclaration } from './controllerDeclarationParser';
import { phpSourceTokenizer } from './tokenizer';

describe('Phase 2019 controller class identity evidence', () => {
  it('binds declaration and imported parent to canonical PHP class identities', () => {
    const source = '<?php namespace App\\Http\\Controllers; use App\\BaseController as ParentController; class OrderController extends ParentController {}';
    const declaration = parseControllerDeclaration(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('OrderController'));
    expect(declaration.classIdentity.value.value).toBe('App\\Http\\Controllers\\OrderController');
    expect(declaration.inheritance.kind).toBe('class');
    if (declaration.inheritance.kind === 'class') {
      expect(declaration.inheritance.identity.kind).toBe('php_class_name_resolved');
      if (declaration.inheritance.identity.kind === 'php_class_name_resolved') {
        expect(declaration.inheritance.identity.qualifiedName.value.value).toBe('App\\BaseController');
        expect(declaration.inheritance.identity.rule).toBe('class_import');
      }
    }
  });

  it('resolves grouped class imports to canonical parent identity', () => {
    const source = '<?php namespace App\\Http\\Controllers; use App\\{BaseController}; class OrderController extends BaseController {}';
    const declaration = parseControllerDeclaration(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('OrderController'));
    expect(declaration.inheritance.kind).toBe('class');
    if (declaration.inheritance.kind === 'class') {
      expect(declaration.inheritance.identity.kind).toBe('php_class_name_resolved');
      if (declaration.inheritance.identity.kind === 'php_class_name_resolved') {
        expect(declaration.inheritance.identity.qualifiedName.value.value).toBe('App\\BaseController');
        expect(declaration.inheritance.identity.rule).toBe('class_import');
      }
    }
  });
});
