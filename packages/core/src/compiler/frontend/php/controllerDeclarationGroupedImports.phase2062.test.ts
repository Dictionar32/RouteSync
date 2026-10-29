import { describe, expect, it } from 'vitest';
import { createAstIdentifier } from './phpAstTypes';
import { controllerDeclarationParser } from './controllerDeclarationParser';
import { phpSourceTokenizer } from './tokenizer';

describe('Phase 2062 grouped PHP class-import evidence', () => {
  it('resolves aliased and nested members from a grouped class import', () => {
    const source = '<?php namespace App\\Http\\Controllers; use App\\Http\\{BaseController as ParentController, Models\\User as UserModel}; class OrderController extends ParentController {}';
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('OrderController'));
    expect(declaration.inheritance.kind).toBe('class');
    if (declaration.inheritance.kind === 'class' && declaration.inheritance.identity.kind === 'php_class_name_resolved') {
      expect(declaration.inheritance.identity.qualifiedName.value.value).toBe('App\\Http\\BaseController');
      expect(declaration.inheritance.identity.rule).toBe('class_import');
    } else {
      throw new Error('Grouped aliased import should resolve to a canonical class identity');
    }
  });

  it('retains a complete class-import inventory when grouped imports also contain function and constant imports', () => {
    const source = '<?php namespace App\\Http\\Controllers; use App\\Http\\{BaseController, function helper, const VERSION}; class OrderController extends BaseController {}';
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('OrderController'));
    expect(declaration.inheritance.kind).toBe('class');
    if (declaration.inheritance.kind === 'class' && declaration.inheritance.identity.kind === 'php_class_name_resolved') {
      expect(declaration.inheritance.identity.qualifiedName.value.value).toBe('App\\Http\\BaseController');
    } else {
      throw new Error('Known non-class grouped imports should not block class-import resolution');
    }
  });

  it('parses multiple ungrouped class imports in one use declaration', () => {
    const source = '<?php namespace App\\Http\\Controllers; use App\\Http\\BaseController as ParentController, App\\SharedController; class OrderController extends ParentController {}';
    const declaration = controllerDeclarationParser.parseSyntaxOnly(source, phpSourceTokenizer.tokenize(source), createAstIdentifier('OrderController'));
    expect(declaration.inheritance.kind).toBe('class');
    if (declaration.inheritance.kind === 'class' && declaration.inheritance.identity.kind === 'php_class_name_resolved') {
      expect(declaration.inheritance.identity.qualifiedName.value.value).toBe('App\\Http\\BaseController');
    } else {
      throw new Error('Multiple class imports should be parsed as distinct bindings');
    }
  });
});
