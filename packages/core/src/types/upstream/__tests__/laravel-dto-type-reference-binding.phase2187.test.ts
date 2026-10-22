import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { scanDtoDeclarationInventory } from '../../../compiler/scanner/subscanners/dtoAstCanonical';
import { createSourceFile, createClassName } from '../names';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';
import { laravelDtoTypeReferenceBindingAuthority, laravelDtoTypeReferenceBindingRuntimeExecutor } from '../laravelDtoTypeReferenceBindingAuthority';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

const sourceSpan = (file: string) => Object.freeze({
  kind: 'source_span' as const,
  file: createSourceFile(file),
  start: Object.freeze({ kind: 'number_value' as const, value: 4 }),
  end: Object.freeze({ kind: 'number_value' as const, value: 4 }),
});

const fixture = async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'routesync-type-reference-phase2187-'));
  temporaryRoots.push(root);
  const directory = path.join(root, 'app', 'Http', 'DTOs');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'UserDto.php'), '<?php\nnamespace App\\Http\\DTOs;\nclass UserDto { public string $name; }\n');
  const sourceProject = createLaravelSourceProjectIdentity(root);
  const inventory = await scanDtoDeclarationInventory(sourceProject);
  return { root, sourceProject, inventory };
};

describe('Laravel DTO type reference binding phase 2187', () => {
  it('composes the existing PHP name and DTO declaration authorities without promoting a short name by itself', async () => {
    const { root, sourceProject, inventory } = await fixture();
    const judgment = laravelDtoTypeReferenceBindingAuthority.bind(Object.freeze({
      kind: 'laravel_dto_type_reference_binding_input',
      sourceProject,
      sourceName: createClassName('UserDto'),
      lexicalContext: Object.freeze({
        kind: 'php_class_name_resolution_context',
        namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'),
        classImports: Object.freeze([Object.freeze({
          kind: 'php_class_import_binding' as const,
          alias: createClassName('UserDto'),
          target: createPhpQualifiedClassName('App\\Http\\DTOs\\UserDto'),
        })]),
        importInventory: 'complete' as const,
      }),
      inventory,
      source: sourceSpan(path.join(root, 'app', 'Http', 'DTOs', 'UserDto.php')),
    }));

    expect(judgment.kind).toBe('laravel_dto_type_reference_bound');
    expect(judgment).toMatchObject({
      classNameResolution: { kind: 'php_class_name_resolved', rule: 'class_import', qualifiedName: { value: { value: 'App\\Http\\DTOs\\UserDto' } } },
      declarationJudgment: { kind: 'response_dto_declaration_resolved' },
      input: { source: { start: { value: 4 } } },
    });
    expect(laravelDtoTypeReferenceBindingRuntimeExecutor.execute).toBe(laravelDtoTypeReferenceBindingAuthority.bind);
  });

  it('retains an explicit unresolved judgment when lexical context is unavailable', async () => {
    const { root, sourceProject, inventory } = await fixture();
    const judgment = laravelDtoTypeReferenceBindingAuthority.bind(Object.freeze({
      kind: 'laravel_dto_type_reference_binding_input',
      sourceProject,
      sourceName: createClassName('UserDto'),
      lexicalContext: Object.freeze({ kind: 'php_class_name_resolution_context_unavailable' }),
      inventory,
      source: sourceSpan(path.join(root, 'app', 'Http', 'DTOs', 'UserDto.php')),
    }));
    expect(judgment).toMatchObject({
      kind: 'laravel_dto_type_reference_unresolved',
      reason: 'class_name_resolution_blocked',
      classNameResolution: { kind: 'php_class_name_resolution_blocked', reason: 'class_name_resolution_context_unavailable' },
      declarationJudgment: { kind: 'not_attempted', reason: 'class_name_resolution_blocked' },
    });
  });

  it('binds a DTO property class reference using the lexical context retained by the Laravel scanner', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'routesync-dto-property-binding-phase2189-'));
    temporaryRoots.push(root);
    const directory = path.join(root, 'app', 'Http', 'DTOs');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'UserDto.php'), '<?php\nnamespace App\\Http\\DTOs;\nclass UserDto { public string $name; }\n');
    await fs.writeFile(path.join(directory, 'OrderDto.php'), '<?php\nnamespace App\\Http\\DTOs;\nuse App\\Http\\DTOs\\UserDto as AccountDto;\nclass OrderDto { public AccountDto $user; }\n');
    const sourceProject = createLaravelSourceProjectIdentity(root);
    const inventory = await scanDtoDeclarationInventory(sourceProject);
    expect(inventory.kind).toBe('laravel_project_dto_declaration_inventory_complete');
    if (inventory.kind !== 'laravel_project_dto_declaration_inventory_complete') {
      throw new Error('Fixture DTO inventory must be complete');
    }
    const order = inventory.receipt.declarations.find(entry => entry.classIdentity.kind === 'dto_class_identity_resolved' && entry.classIdentity.resolution.qualifiedName.value.value === 'App\\Http\\DTOs\\OrderDto');
    expect(order).toBeDefined();
    if (order === undefined) {
      throw new Error('OrderDto declaration must be discovered');
    }
    const properties = order.declaration.semantic.properties.items;
    const userProperty = properties.kind === 'cons' ? properties.head : undefined;
    expect(userProperty?.typeEvidence.kind).toBe('dto_property_class_reference_type_evidence');
    if (userProperty?.typeEvidence.kind !== 'dto_property_class_reference_type_evidence') {
      throw new Error('AccountDto property must retain class-reference evidence');
    }
    const judgment = laravelDtoTypeReferenceBindingAuthority.bind(Object.freeze({
      kind: 'laravel_dto_type_reference_binding_input',
      sourceProject,
      sourceName: userProperty.typeEvidence.sourceName,
      lexicalContext: userProperty.typeEvidence.lexicalContext,
      inventory,
      source: userProperty.typeEvidence.source,
    }));
    expect(judgment).toMatchObject({
      kind: 'laravel_dto_type_reference_bound',
      classNameResolution: { kind: 'php_class_name_resolved', rule: 'class_import', qualifiedName: { value: { value: 'App\\Http\\DTOs\\UserDto' } } },
      declarationJudgment: { kind: 'response_dto_declaration_resolved' },
    });
  });

});
