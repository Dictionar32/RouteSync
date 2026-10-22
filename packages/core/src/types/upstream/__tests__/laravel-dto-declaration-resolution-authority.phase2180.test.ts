import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { scanDtoDeclarationInventory } from '../../../compiler/scanner/subscanners/dtoAstCanonical';
import { createSourceFile, createClassName } from '../names';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import { phpClassNameResolutionAuthority } from '../phpClassNameResolutionAuthority';
import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';
import { laravelControllerResponseDtoDeclarationResolutionAuthority } from '../laravelControllerResponseDtoDeclarationResolutionAuthority';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

const sourceSpan = (file: string) => Object.freeze({
  kind: 'source_span' as const,
  file: createSourceFile(file),
  start: Object.freeze({ kind: 'number_value' as const, value: 1 }),
  end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
});

const projectWithDto = async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'routesync-dto-phase2180-'));
  temporaryRoots.push(root);
  const dtoDirectory = path.join(root, 'app', 'Http', 'DTOs');
  await fs.mkdir(dtoDirectory, { recursive: true });
  await fs.writeFile(path.join(dtoDirectory, 'UserDto.php'), '<?php\nnamespace App\\Http\\DTOs;\nclass UserDto { public string $name; }\n');
  const sourceProject = createLaravelSourceProjectIdentity(root);
  const inventory = await scanDtoDeclarationInventory(sourceProject);
  return { root, sourceProject, inventory };
};

describe('DTO declaration resolution authority phase 2180', () => {
  it('resolves a namespaced DTO through the existing PHP class-name authority and preserves project/source provenance', async () => {
    const { root, sourceProject, inventory } = await projectWithDto();
    expect(inventory.kind).toBe('laravel_project_dto_declaration_inventory_complete');
    const completeInventory = (() => {
      switch (inventory.kind) {
        case 'laravel_project_dto_declaration_inventory_incomplete':
          throw Error('Expected the temporary DTO fixture to produce a complete inventory');
        case 'laravel_project_dto_declaration_inventory_complete':
          return inventory;
      }
    })();
    expect(completeInventory.receipt.declarations[0]?.classIdentity).toMatchObject({
      kind: 'dto_class_identity_resolved',
      resolution: {
        kind: 'php_class_name_resolved',
        qualifiedName: { value: { value: 'App\\Http\\DTOs\\UserDto' } },
        rule: 'namespace_relative',
      },
    });

    const requestedClassResolution = phpClassNameResolutionAuthority.judge(Object.freeze({
      kind: 'php_class_name_resolution_input',
      sourceName: createClassName('UserDto'),
      context: Object.freeze({
        kind: 'php_class_name_resolution_context',
        namespaceName: createPhpQualifiedClassName('App\\Http\\Controllers'),
        classImports: Object.freeze([Object.freeze({
          kind: 'php_class_import_binding' as const,
          alias: createClassName('UserDto'),
          target: createPhpQualifiedClassName('App\\Http\\DTOs\\UserDto'),
        })]),
        importInventory: 'complete' as const,
      }),
    }));

    const judgment = laravelControllerResponseDtoDeclarationResolutionAuthority.resolve(Object.freeze({
      kind: 'laravel_controller_response_dto_declaration_resolution_input',
      sourceProject,
      inventory: completeInventory,
      requestedClassResolution,
      requestSource: sourceSpan(path.join(root, 'app', 'Http', 'Controllers', 'UserController.php')),
      owner: Object.freeze({ kind: 'dto_property_type_reference_owner' as const, propertySource: sourceSpan(path.join(root, 'app', 'Http', 'Controllers', 'UserController.php')) }),
    }));

    expect(judgment.kind).toBe('response_dto_declaration_resolved');
    expect(judgment).toMatchObject({
      identity: {
        sourceProject: { root: { value: { value: root } } },
        className: { value: { value: 'App\\Http\\DTOs\\UserDto' } },
        sourceFile: { value: { value: path.join(root, 'app', 'Http', 'DTOs', 'UserDto.php') } },
      },
    });
  });

  it('keeps incomplete discovery as an unresolved judgment rather than treating it as an empty inventory', async () => {
    const { root, sourceProject } = await projectWithDto();
    const inventory = Object.freeze({
      kind: 'laravel_project_dto_declaration_inventory_incomplete' as const,
      contractVersion: 4 as const,
      sourceProject,
      scope: Object.freeze({
        kind: 'laravel_dto_declaration_discovery_scope' as const,
        projectRoot: sourceProject.root,
        relativeDirectory: 'app/Http/DTOs' as const,
      }),
      partialEvidence: Object.freeze({ discoveredSourceFiles: Object.freeze([]), declarations: Object.freeze([]) }),
      blockers: Object.freeze([Object.freeze({ kind: 'dto_discovery_root_missing' as const, root: createSourceFile(path.join(root, 'missing')) })]),
    });
    const judgment = laravelControllerResponseDtoDeclarationResolutionAuthority.resolve(Object.freeze({
      kind: 'laravel_controller_response_dto_declaration_resolution_input',
      sourceProject,
      inventory,
      requestedClassResolution: Object.freeze({
        kind: 'php_class_name_resolution_blocked' as const,
        sourceName: createClassName('UserDto'),
        reason: 'class_name_resolution_context_unavailable' as const,
      }),
      requestSource: sourceSpan(path.join(root, 'app', 'Http', 'Controllers', 'UserController.php')),
      owner: Object.freeze({ kind: 'dto_property_type_reference_owner' as const, propertySource: sourceSpan(path.join(root, 'app', 'Http', 'Controllers', 'UserController.php')) }),
    }));

    expect(judgment).toMatchObject({ kind: 'response_dto_declaration_unresolved', reason: 'inventory_incomplete' });
  });
});
