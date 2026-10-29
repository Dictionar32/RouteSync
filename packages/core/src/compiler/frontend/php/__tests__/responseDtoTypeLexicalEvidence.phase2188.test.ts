import { describe, expect, it } from 'vitest';
import { LaravelSourceLexer } from '../../../scanner/LaravelSourceLexer';
import { createAstIdentifier } from '../phpAstTypes';

describe('response DTO type lexical evidence phase 2188', () => {
  it('preserves namespace imports and aliases for class-typed DTO properties', () => {
    const source = `<?php
namespace App\\Http\\DTOs;
use App\\Models\\User as AccountUser;
class UserDto {
    public AccountUser $user;
    public \\App\\Models\\Order $order;
    public ?AccountUser $nullableUser;
}`;
    const tokens = LaravelSourceLexer.tokenize(source);
    const declaration = LaravelSourceLexer.parseResponseDtoDeclaration(tokens, createAstIdentifier('UserDto'));
    const user = declaration.properties[0];
    const order = declaration.properties[1];
    const nullableUser = declaration.properties[2];

    expect(user?.typeEvidence.kind).toBe('php_class_reference_property_type');
    if (user?.typeEvidence.kind === 'php_class_reference_property_type') {
      expect(user.typeEvidence.sourceName.value.value).toBe('AccountUser');
      expect(user.typeEvidence.lexicalContext.namespaceName.value.value).toBe('App\\Http\\DTOs');
      expect(user.typeEvidence.lexicalContext.classImports.map(binding => [binding.alias.value.value, binding.target.value.value])).toEqual([
        ['AccountUser', 'App\\Models\\User'],
      ]);
    }

    expect(order?.typeEvidence.kind).toBe('php_class_reference_property_type');
    if (order?.typeEvidence.kind === 'php_class_reference_property_type') {
      expect(order.typeEvidence.sourceName.value.value).toBe('\\App\\Models\\Order');
    }

    expect(nullableUser?.type.kind).toBe('nullable');
    expect(nullableUser?.typeEvidence.kind).toBe('php_class_reference_property_type');
  });

  it('does not misclassify union syntax as a single class reference', () => {
    const source = `<?php
namespace App\\Http\\DTOs;
class UserDto {
    public User|Guest $actor;
}`;
    const declaration = LaravelSourceLexer.parseResponseDtoDeclaration(
      LaravelSourceLexer.tokenize(source),
      createAstIdentifier('UserDto'),
    );

    expect(declaration.properties[0]?.typeEvidence.kind).toBe('php_unsupported_property_type_syntax');
    expect(declaration.properties[0]?.type).toEqual({ kind: 'mixed' });
  });
});
