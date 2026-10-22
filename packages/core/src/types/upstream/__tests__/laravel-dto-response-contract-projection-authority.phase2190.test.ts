import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { scanDtoDeclarationInventory } from '../../../compiler/scanner/subscanners/dtoAstCanonical';
import { createClassName, createSourceFile } from '../names';
import { createLaravelSourceProjectIdentity } from '../sourceProjectIdentity';
import { phpClassNameResolutionAuthority } from '../phpClassNameResolutionAuthority';
import { createPhpQualifiedClassName } from '../phpClassNameResolutionInterface';
import { laravelControllerResponseDtoDeclarationResolutionAuthority } from '../laravelControllerResponseDtoDeclarationResolutionAuthority';
import { createLaravelDtoResponseContractProjectionAuthority, laravelDtoResponseContractProjectionAuthority } from '../laravelDtoResponseContractProjectionAuthority';
import { laravelDtoResponseValueProjectionAuthority } from '../laravelDtoResponseValueProjectionAuthority';
import { createLaravelControllerResponseSemanticPipeline, laravelControllerResponseSemanticPipeline, laravelControllerResponseSemanticPipelineDependencies } from '../laravelControllerResponseSemanticPipeline';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

const sourceSpan = (file: string) => Object.freeze({
  kind: 'source_span' as const,
  file: createSourceFile(file),
  start: Object.freeze({ kind: 'number_value' as const, value: 1 }),
  end: Object.freeze({ kind: 'number_value' as const, value: 1 }),
});

const createFixture = async (body: string) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'routesync-dto-projection-phase2190-'));
  roots.push(root);
  const dtoDirectory = path.join(root, 'app', 'Http', 'DTOs');
  await fs.mkdir(dtoDirectory, { recursive: true });
  await fs.writeFile(path.join(dtoDirectory, 'UserDto.php'), `<?php\nnamespace App\\Http\\DTOs;\nclass UserDto { ${body} }\n`);
  const sourceProject = createLaravelSourceProjectIdentity(root);
  const inventory = await scanDtoDeclarationInventory(sourceProject);
  if (inventory.kind === 'laravel_project_dto_declaration_inventory_incomplete') {
    throw new Error('DTO fixture inventory should be complete');
  }
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
  const declarationJudgment = laravelControllerResponseDtoDeclarationResolutionAuthority.resolve(Object.freeze({
    kind: 'laravel_controller_response_dto_declaration_resolution_input',
    sourceProject,
    inventory,
    requestedClassResolution,
    requestSource: sourceSpan(path.join(root, 'app', 'Http', 'Controllers', 'UserController.php')),
      owner: Object.freeze({ kind: 'dto_property_type_reference_owner' as const, propertySource: sourceSpan(path.join(root, 'app', 'Http', 'Controllers', 'UserController.php')) }),
  }));
  if (declarationJudgment.kind !== 'response_dto_declaration_resolved') {
    throw new Error('DTO declaration should resolve in this fixture');
  }
  return { root, declarationJudgment };
};

describe('Laravel DTO response contract projection authority', () => {
  it('is the existing integrated response pipeline dependency, not a parallel authority', () => {
    expect(laravelControllerResponseSemanticPipeline.dtoResponseContractProjection).toBe(laravelDtoResponseContractProjectionAuthority);
    expect(laravelControllerResponseSemanticPipeline.contractVersion).toBe(28);
  });

  it('accepts the value authority through its authority interface and wires the response pipeline through the projection authority interface', async () => {
    let projectedValues = 0;
    const valueAuthority = Object.freeze({
      ...laravelDtoResponseValueProjectionAuthority,
      project: (input: Parameters<typeof laravelDtoResponseValueProjectionAuthority.project>[0]) => {
        projectedValues += 1;
        return laravelDtoResponseValueProjectionAuthority.project(input);
      },
    });
    const contractAuthority = createLaravelDtoResponseContractProjectionAuthority(valueAuthority);
    const pipeline = createLaravelControllerResponseSemanticPipeline(Object.freeze({ ...laravelControllerResponseSemanticPipelineDependencies, dtoResponseContractProjectionAuthority: contractAuthority }));
    const { declarationJudgment } = await createFixture('public int $id; public string $name;');
    const judgment = pipeline.dtoResponseContractProjection.project(Object.freeze({
      kind: 'laravel_dto_response_contract_projection_input',
      declarationJudgment,
      responseShapeEvidence: Object.freeze({ kind: 'laravel_dto_response_shape_available', shape: 'single' }),
      propertyTypeReferenceBindings: Object.freeze([]),
    }));

    expect(pipeline.dtoResponseContractProjection).toBe(contractAuthority);
    expect(pipeline.evidenceProduction).toBe(pipeline.dependencies.evidenceProduction);
    expect(pipeline.methodResponseAstProjection).toBe(pipeline.dependencies.methodResponseAstProjection);
    expect(pipeline.responseOutputTypeJudgment).toBe(pipeline.methodResponseAstProjection.outputTypeJudgment);
    expect(contractAuthority.authorityRole).toBe('semantic_judgment_owner');
    expect(judgment.kind).toBe('laravel_dto_response_contract_projection_resolved');
    expect(projectedValues).toBe(2);
  });

  it('projects supported typed DTO fields into the canonical ResponseContract', async () => {
    const { root, declarationJudgment } = await createFixture('public int $id; public float $score; public string $name; public bool $active;');
    const judgment = laravelDtoResponseContractProjectionAuthority.project(Object.freeze({
      kind: 'laravel_dto_response_contract_projection_input',
      declarationJudgment,
      responseShapeEvidence: Object.freeze({ kind: 'laravel_dto_response_shape_available', shape: 'single' }),
      propertyTypeReferenceBindings: Object.freeze([]),
    }));

    expect(judgment.kind).toBe('laravel_dto_response_contract_projection_resolved');
    if (judgment.kind !== 'laravel_dto_response_contract_projection_resolved') {
      throw new Error('Supported scalar DTO should project');
    }
    expect(judgment.responseContract.name.value.value).toBe('App\\Http\\DTOs\\UserDto');
    expect(judgment.responseContract.fields.map(field => [field.name.value, field.value])).toEqual([
      ['id', { kind: 'scalar', value: { kind: 'whole_number' } }],
      ['score', { kind: 'scalar', value: { kind: 'decimal_number' } }],
      ['name', { kind: 'scalar', value: { kind: 'textual' } }],
      ['active', { kind: 'scalar', value: { kind: 'boolean_flag' } }],
    ]);
    expect(judgment.declarationSource.file.value.value).toBe(path.join(root, 'app', 'Http', 'DTOs', 'UserDto.php'));
    expect(judgment.fieldProjections).toHaveLength(4);
  });

  it('does not guess a response contract when a field type is not representable', async () => {
    const { declarationJudgment } = await createFixture('public array $metadata; public string $name;');
    const judgment = laravelDtoResponseContractProjectionAuthority.project(Object.freeze({
      kind: 'laravel_dto_response_contract_projection_input',
      declarationJudgment,
      responseShapeEvidence: Object.freeze({ kind: 'laravel_dto_response_shape_available', shape: 'single' }),
      propertyTypeReferenceBindings: Object.freeze([]),
    }));

    expect(judgment).toMatchObject({
      kind: 'laravel_dto_response_contract_projection_unresolved',
      reason: 'dto-field-type-not-representable-in-response-contract',
    });
  });

  it('blocks projection when the controller response shape evidence is missing', async () => {
    const { declarationJudgment } = await createFixture('public string $name;');
    expect(laravelDtoResponseContractProjectionAuthority.project(Object.freeze({
      kind: 'laravel_dto_response_contract_projection_input',
      declarationJudgment,
      responseShapeEvidence: Object.freeze({ kind: 'laravel_dto_response_shape_unavailable', reason: 'controller_response_shape_evidence_missing' }),
      propertyTypeReferenceBindings: Object.freeze([]),
    }))).toMatchObject({
      kind: 'laravel_dto_response_contract_projection_unresolved',
      reason: 'response-shape-evidence-unavailable',
    });
  });
});
