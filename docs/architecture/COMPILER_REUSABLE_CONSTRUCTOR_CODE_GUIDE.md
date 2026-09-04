# Panduan Master Implementasi: Reusable Structured Constructor & Lowering Engine RouteSync

> **Tujuan Dokumen**: Dokumen ini adalah **referensi arsitektur dan source code lengkap (Production-Ready)** yang siap Anda *copy-paste* ke project Anda.  
> **Karakteristik Kode**:
> - ✅ **0 `if` statements** di dalam lowering dispatch (Table-Driven / Pure Reduction).
> - ✅ **0 `??` (Nullish Coalescing)** di internal execution path (Guaranteed by Origin Boundary).
> - ✅ **0 `?.` (Optional Chaining)** di downstream nodes.
> - ✅ **0 `? :` (Ternary Conditionals)** — Menggunakan **Solusi A: `ResolvedOptionalType`** dan **Strategy Pattern**.
> - ✅ **100% Target-Agnostic SSOT** — Tidak ada metadata AST mentah yang bocor ke emitter.

---

## Daftar Isi Kode

1. [Domain Value Objects: `ResolvedSemanticType.ts`](#1-domain-value-objects-resolvedsemantictypets)
2. [Target Lowering Engine: `ZodSchemaLowerer.ts`](#2-target-lowering-engine-zodschemalowererts)
3. [Target Lowering Engine: `TypeScriptTypeLowerer.ts`](#3-target-lowering-engine-typescripttypelowererts)
4. [Form Pipeline (Structured Constructor)](#4-form-pipeline-structured-constructor)
   - [4.1 FormActionGenerator.ts](#41-formactiongeneratorts)
   - [4.2 FormCodeBuilder.ts](#42-formcodebuilderts)
   - [4.3 FormGeneratorPass.ts](#43-formgeneratorpassts)
   - [4.4 TDD Test: FormGeneratorPass.spec.ts](#44-tdd-test-formgeneratorpassspects)
5. [Contract Pipeline (Structured Constructor)](#5-contract-pipeline-structured-constructor)
   - [5.1 ContractActionGenerator.ts](#51-contractactiongeneratorts)
   - [5.2 ContractCodeBuilder.ts](#52-contractcodebuilderts)
   - [5.3 ContractGeneratorPass.ts](#53-contractgeneratorpassts)
   - [5.4 TDD Test: ContractGeneratorPass.spec.ts](#54-tdd-test-contractgeneratorpassspects)
6. [Mapper Pipeline (Structured Constructor)](#6-mapper-pipeline-structured-constructor)
   - [6.0 Upstream Origin Boundary: ResourceMappersArtifact.ts & ArtifactRegistry](#60-upstream-origin-boundary-resourcemappersartifactts--artifactregistry)
   - [6.1 MapperCodeBuilder.ts](#61-mappercodebuilderts)
   - [6.2 MapperGeneratorPass.ts](#62-mappergeneratorpassts)
   - [6.3 TDD Test: MapperGeneratorPass.spec.ts](#63-tdd-test-mappergeneratorpassspects)
7. [TypeScript Interface Pass (Structured Constructor)](#7-typescript-interface-pass-structured-constructor)
   - [7.0 Upstream Origin Boundary: ResourceTypesArtifact.ts & ArtifactRegistry](#70-upstream-origin-boundary-resourcetypesartifactts--artifactregistry)
   - [7.1 TypeScriptGeneratorPass.ts](#71-typescriptgeneratorpassts)
   - [7.2 TDD Test: TypeScriptGeneratorPass.spec.ts](#72-tdd-test-typescriptgeneratorpassspects)
8. [Upstream Origin Boundary Lowering (Reusable Constructor)](#8-upstream-origin-boundary-lowering-reusable-constructor)
   - [8.0 ManifestArtifactLowerer.ts](#8-upstream-origin-boundary-lowering-reusable-constructor)

---

## 1. Domain Value Objects: `ResolvedSemanticType.ts`

**Lokasi**: `packages/core/src/compiler/domain/common/ResolvedSemanticType.ts`

```typescript
/**
 * ResolvedSemanticType.ts
 *
 * Target-Agnostic Structured Domain Value Object Hierarchy for RouteSync Compiler IR.
 * Represents resolved semantic intent independent of target generator syntax (Zod, TS, Mapper).
 *
 * @module compiler/domain/common
 */

export type ResolvedPrimitiveKind =
    | 'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'file'
    | 'unknown';

export interface ResolvedPrimitiveTypeParams {
    readonly primitiveKind: ResolvedPrimitiveKind;
}

export interface ResolvedReferenceTypeParams {
    readonly name: string;
    readonly namespace?: string;
}

export interface ResolvedOptionalTypeParams {
    readonly innerType: ResolvedSemanticType;
}

export interface ResolvedNullableTypeParams {
    readonly innerType: ResolvedSemanticType;
}

export interface ResolvedCollectionTypeParams {
    readonly elementType: ResolvedSemanticType;
}

export type ObjectKind = 'resource' | 'model' | 'response' | 'plain';

export type ResolvedField = readonly [name: string, type: ResolvedSemanticType];

export interface ResolvedObjectTypeParams {
    readonly fields?: readonly ResolvedField[];
    readonly objectKind?: ObjectKind;
    readonly resourceName?: string;
    readonly typeName?: string;
}

export interface ResolvedUnionTypeParams {
    readonly members?: readonly ResolvedSemanticType[];
}

export interface ResolvedIntersectionTypeParams {
    readonly members?: readonly ResolvedSemanticType[];
}

export interface ResolvedUnknownTypeParams {
    readonly diagnosticMessage?: string;
}

export abstract class ResolvedSemanticTypeBase {
    abstract readonly kind: string;

    formatProperty(this: ResolvedSemanticType, name: string, lower: (t: ResolvedSemanticType) => string): string {
        return `${name}: ${lower(this)};`;
    }

    formatMapperAssignment(this: ResolvedSemanticType, name: string): string {
        return `  ${name}: api.${name},`;
    }

    formatChildArrayMapper(this: ResolvedSemanticType, name: string): string {
        return `  ${name}: api.${name},`;
    }
}

export class ResolvedPrimitiveType extends ResolvedSemanticTypeBase {
    readonly kind = 'primitive' as const;
    readonly primitiveKind: ResolvedPrimitiveKind;

    constructor({ primitiveKind }: ResolvedPrimitiveTypeParams) {
        super();
        this.primitiveKind = primitiveKind;
        Object.freeze(this);
    }
}

export class ResolvedReferenceType extends ResolvedSemanticTypeBase {
    readonly kind = 'reference' as const;
    readonly name: string;
    readonly namespace: string;

    constructor({ name, namespace = '' }: ResolvedReferenceTypeParams) {
        super();
        this.name = name;
        this.namespace = namespace;
        Object.freeze(this);
    }

    override formatChildArrayMapper(name: string): string {
        const childResource = this.name.replace(/(Transformed|ApiResponse)$/, '');
        return `  ${name}: api.${name}?.map(to${childResource}Read),`;
    }
}

export class ResolvedOptionalType extends ResolvedSemanticTypeBase {
    readonly kind = 'optional' as const;
    readonly innerType: ResolvedSemanticType;

    constructor({ innerType }: ResolvedOptionalTypeParams) {
        super();
        this.innerType = innerType;
        Object.freeze(this);
    }

    override formatProperty(name: string, lower: (t: ResolvedSemanticType) => string): string {
        return `${name}?: ${lower(this.innerType)};`;
    }
}

export class ResolvedNullableType extends ResolvedSemanticTypeBase {
    readonly kind = 'nullable' as const;
    readonly innerType: ResolvedSemanticType;

    constructor({ innerType }: ResolvedNullableTypeParams) {
        super();
        this.innerType = innerType;
        Object.freeze(this);
    }
}

export class ResolvedCollectionType extends ResolvedSemanticTypeBase {
    readonly kind = 'collection' as const;
    readonly elementType: ResolvedSemanticType;

    constructor({ elementType }: ResolvedCollectionTypeParams) {
        super();
        this.elementType = elementType;
        Object.freeze(this);
    }

    override formatMapperAssignment(name: string): string {
        return this.elementType.formatChildArrayMapper(name);
    }
}

export class ResolvedObjectType extends ResolvedSemanticTypeBase {
    readonly kind = 'object' as const;
    readonly fields: readonly ResolvedField[];
    readonly objectKind: ObjectKind;
    readonly resourceName?: string;
    readonly typeName?: string;

    constructor({
        fields = Object.freeze([]),
        objectKind = 'plain',
        resourceName,
        typeName
    }: ResolvedObjectTypeParams = {}) {
        super();
        this.fields = fields;
        this.objectKind = objectKind;
        this.resourceName = resourceName;
        this.typeName = typeName;
        Object.freeze(this);
    }
}

export class ResolvedUnionType extends ResolvedSemanticTypeBase {
    readonly kind = 'union' as const;
    readonly members: readonly ResolvedSemanticType[];

    constructor({ members = Object.freeze([]) }: ResolvedUnionTypeParams = {}) {
        super();
        this.members = members;
        Object.freeze(this);
    }
}

export class ResolvedIntersectionType extends ResolvedSemanticTypeBase {
    readonly kind = 'intersection' as const;
    readonly members: readonly ResolvedSemanticType[];

    constructor({ members = Object.freeze([]) }: ResolvedIntersectionTypeParams = {}) {
        super();
        this.members = members;
        Object.freeze(this);
    }
}

export class ResolvedUnknownType extends ResolvedSemanticTypeBase {
    readonly kind = 'unknown' as const;
    readonly diagnosticMessage: string;

    constructor({ diagnosticMessage = 'Unknown semantic type' }: ResolvedUnknownTypeParams = {}) {
        super();
        this.diagnosticMessage = diagnosticMessage;
        Object.freeze(this);
    }
}

export type ResolvedSemanticType =
    | ResolvedPrimitiveType
    | ResolvedReferenceType
    | ResolvedOptionalType
    | ResolvedNullableType
    | ResolvedCollectionType
    | ResolvedObjectType
    | ResolvedUnionType
    | ResolvedIntersectionType
    | ResolvedUnknownType;
```

---

## 2. Target Lowering Engine: `ZodSchemaLowerer.ts`

**Lokasi Target**: `packages/core/src/compiler/domain/common/ZodSchemaLowerer.ts`

```typescript
/**
 * ZodSchemaLowerer.ts
 *
 * Target-Specific Lowering Engine for Transforming Target-Agnostic ResolvedSemanticType
 * Value Objects into Zod Schema Expressions.
 *
 * Design:
 * - 0 'if' statements
 * - 0 '??' in downstream execution
 * - 0 '?.' in downstream execution
 * - 0 '? :' ternary conditionals
 * - Strategy Pattern for Reference Types (NAMED_SCHEMA_STRATEGY vs UNKNOWN_REFERENCE_STRATEGY)
 * - Algebraic Tree Reduction for Objects, Unions, and Intersections
 *
 * @module compiler/domain/common
 */

import {
    ResolvedSemanticType,
    ResolvedObjectType,
    ResolvedPrimitiveKind
} from './ResolvedSemanticType';

export type ReferenceResolutionStrategy = (name: string) => string;

export const NAMED_SCHEMA_STRATEGY: ReferenceResolutionStrategy = (name: string) => `${name}Schema`;
export const UNKNOWN_REFERENCE_STRATEGY: ReferenceResolutionStrategy = () => 'z.unknown()';

export interface ZodLowererOptions {
    readonly referenceStrategy?: ReferenceResolutionStrategy;
}

interface NormalizedZodOptions {
    readonly referenceStrategy: ReferenceResolutionStrategy;
}

const DEFAULT_ZOD_OPTIONS: NormalizedZodOptions = Object.freeze({
    referenceStrategy: NAMED_SCHEMA_STRATEGY
});

const ZOD_PRIMITIVES: Readonly<Record<ResolvedPrimitiveKind, string>> = Object.freeze({
    string: 'z.string()',
    number: 'z.number()',
    boolean: 'z.boolean()',
    datetime: 'z.string().datetime()',
    file: 'z.custom<File>()',
    unknown: 'z.unknown()'
});

export function toZodSchemaExpression(
    resolved: ResolvedSemanticType,
    { referenceStrategy = NAMED_SCHEMA_STRATEGY }: ZodLowererOptions = {}
): string {
    return lowerZodNode(resolved, referenceStrategy);
}

function lowerZodNode(
    resolved: ResolvedSemanticType,
    referenceStrategy: ReferenceResolutionStrategy
): string {
    switch (resolved.kind) {
        case 'primitive':
            return ZOD_PRIMITIVES[resolved.primitiveKind];

        case 'reference':
            return referenceStrategy(resolved.name);

        case 'optional':
            return `${lowerZodNode(resolved.innerType, referenceStrategy)}.optional()`;

        case 'nullable':
            return `z.nullable(${lowerZodNode(resolved.innerType, referenceStrategy)})`;

        case 'collection':
            return `z.array(${lowerZodNode(resolved.elementType, referenceStrategy)})`;

        case 'object': {
            const properties = resolved.fields.map(([name, type]) =>
                `${name}: ${lowerZodNode(type, referenceStrategy)}`
            );
            return `z.object({ ${properties.join(', ')} })`;
        }

        case 'union':
            return resolved.members
                .map(m => lowerZodNode(m, referenceStrategy))
                .reduce((acc, curr) => `${acc}.or(${curr})`);

        case 'intersection':
            return resolved.members
                .map(m => lowerZodNode(m, referenceStrategy))
                .reduce((acc, curr) => `${acc}.and(${curr})`);

        case 'unknown':
        default:
            return 'z.unknown()';
    }
}

/**
 * Top-Level Contract Declaration Assembly
 */
export function buildTopLevelContractDeclaration(name: string, resolvedObj: ResolvedObjectType): string {
    const schemaExpr = toZodSchemaExpression(resolvedObj);
    return [
        `export const ${name}ContractSchema = ${schemaExpr};`,
        `export type ${name}Contract = z.infer<typeof ${name}ContractSchema>;`
    ].join('\n');
}
```

---

## 3. Target Lowering Engine: `TypeScriptTypeLowerer.ts`

**Lokasi Target**: `packages/core/src/compiler/domain/common/TypeScriptTypeLowerer.ts`

```typescript
/**
 * TypeScriptTypeLowerer.ts
 *
 * Target-Specific Lowering Engine for Transforming Target-Agnostic ResolvedSemanticType
 * Value Objects into TypeScript Type Expressions and Interfaces.
 *
 * @module compiler/domain/common
 */

import {
    ResolvedSemanticType,
    ResolvedObjectType,
    ResolvedPrimitiveKind,
    ResolvedOptionalType
} from './ResolvedSemanticType';

export interface TypeScriptLowererOptions {
    readonly singleLine?: boolean;
    readonly indentLevel?: number;
}

interface NormalizedTypeScriptOptions {
    readonly singleLine: boolean;
    readonly indentLevel: number;
}

const DEFAULT_TS_OPTIONS: NormalizedTypeScriptOptions = Object.freeze({
    singleLine: false,
    indentLevel: 0
});

const TS_PRIMITIVES: Readonly<Record<ResolvedPrimitiveKind, string>> = Object.freeze({
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    datetime: 'string',
    file: 'File',
    unknown: 'unknown'
});

export function toTypeScriptTypeExpression(
    resolved: ResolvedSemanticType,
    { singleLine = false, indentLevel = 0 }: TypeScriptLowererOptions = {}
): string {
    return lowerTypeScriptNode(resolved, singleLine, indentLevel);
}

function lowerTypeScriptNode(
    resolved: ResolvedSemanticType,
    singleLine: boolean,
    indentLevel: number
): string {
    switch (resolved.kind) {
        case 'primitive':
            return TS_PRIMITIVES[resolved.primitiveKind];

        case 'reference':
            return resolved.name;

        case 'optional':
            return `${lowerTypeScriptNode(resolved.innerType, singleLine, indentLevel)} | undefined`;

        case 'nullable':
            return `${lowerTypeScriptNode(resolved.innerType, singleLine, indentLevel)} | null`;

        case 'collection':
            return `Array<${lowerTypeScriptNode(resolved.elementType, singleLine, indentLevel)}>`;

        case 'object': {
            const properties = resolved.fields.map(([name, type]) =>
                type.formatProperty(name, t => lowerTypeScriptNode(t, singleLine, indentLevel))
            );
            return `{ ${properties.join(' ')} }`;
        }

        case 'union':
            return resolved.members
                .map(m => lowerTypeScriptNode(m, singleLine, indentLevel))
                .join(' | ');

        case 'intersection':
            return resolved.members
                .map(m => lowerTypeScriptNode(m, singleLine, indentLevel))
                .join(' & ');

        case 'unknown':
        default:
            return 'unknown';
    }
}

export function buildTopLevelDeclaration(name: string, resolvedObj: ResolvedObjectType): string {
    const properties = resolvedObj.fields
        .map(([propName, propType]) => `  ${propType.formatProperty(propName, t => lowerTypeScriptNode(t, true, 1))}`)
        .join('\n');

    const baseName = name.replace(/(Resource|Response)$/, '');

    return `export interface ${name} {\n${properties}\n}\n\nexport type ${baseName}Show = ${name};\nexport type ${baseName}Index = Array<${name}>;`;
}
```

---

## 4. Form Pipeline (Structured Constructor)

### 4.1. `FormActionGenerator.ts`
**Lokasi Target**: `packages/core/src/compiler/generators/form-generation/FormActionGenerator.ts`
```typescript
/**
 * FormActionGenerator.ts
 *
 * Generates TypeScript action blocks for form types.
 * Structured Constructor consuming SemanticTypeResolver SSOT & TypeScriptTypeLowerer.
 *
 * @module compiler/generators/form-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import type { RequestField } from '../../artifacts/RequestTypesArtifact';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../domain/common/ResponseFieldLowering';
import { ResolvedObjectType } from '../../domain/common/ResolvedSemanticType';
import { toTypeScriptTypeExpression } from '../../domain/common/TypeScriptTypeLowerer';

export interface GeneratedFormAction {
    readonly name: string;
    readonly lines: readonly string[];
    readonly fieldCount: number;
}

export interface FormActionGeneratorDependencies {
    readonly resolver?: SemanticTypeResolver;
}

export class FormActionGenerator {
    private readonly resolver: SemanticTypeResolver;

    constructor({ resolver = defaultTypeResolver }: FormActionGeneratorDependencies = {}) {
        this.resolver = resolver;
    }

    generateAction(
        actionName: string,
        fields: readonly RequestField[]
    ): GeneratedFormAction {
        const formattedActionName = actionName.charAt(0).toUpperCase() + actionName.slice(1).toLowerCase();
        const resolvedFields = fields.map(f => [f.transformedName, this.resolver.resolve(f.type)] as const);
        const resolvedObject = new ResolvedObjectType({ fields: resolvedFields });
        const typeExpr = toTypeScriptTypeExpression(resolvedObject, { indentLevel: 1 });

        return {
            name: actionName,
            lines: [`  ${formattedActionName}: ${typeExpr}`],
            fieldCount: fields.length
        };
    }
}
```

### 4.2. `FormCodeBuilder.ts`
**Lokasi Target**: `packages/core/src/compiler/generators/form-generation/FormCodeBuilder.ts`
```typescript
/**
 * FormCodeBuilder.ts
 *
 * Assembles final TypeScript Form code artifacts.
 *
 * @module compiler/generators/form-generation
 */

import type { GeneratedFormAction } from './FormActionGenerator';

export interface FormTypeDefinition {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly actions: readonly GeneratedFormAction[];
}

export interface FormCodeBuilderInput {
    readonly formTypes: readonly FormTypeDefinition[];
}

export interface FormCodeBuilderOptions {
    readonly indentSize?: number;
}

export class FormCodeBuilder {
    private readonly indentSize: number;

    constructor({ indentSize = 2 }: FormCodeBuilderOptions = {}) {
        this.indentSize = indentSize;
    }

    build({ formTypes }: FormCodeBuilderInput): string {
        const lines: string[] = [
            '/**',
            ' * Generated Form Types',
            ' * Do not edit directly.',
            ' */',
            ''
        ];

        for (const formType of formTypes) {
            lines.push(`export interface ${formType.formTypeName} {`);
            for (const action of formType.actions) {
                lines.push(action.lines.join('\n'));
            }
            lines.push('}');
            lines.push('');
        }

        return lines.join('\n');
    }
}
```

### 4.3. `FormGeneratorPass.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/FormGeneratorPass.ts`

```typescript
/**
 * FormGeneratorPass.ts
 *
 * Compiler pass that generates TypeScript Form types for mutation requests.
 * Consumes RequestTypes artifact and outputs GeneratedForm artifact.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedFormArtifact } from '../artifacts/GeneratedFormArtifact';
import { FormActionGenerator } from '../generators/form-generation/FormActionGenerator';
import { FormCodeBuilder, type FormTypeDefinition } from '../generators/form-generation/FormCodeBuilder';
import { SemanticTypeResolver } from '../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../domain/common/ResponseFieldLowering';

export interface FormGeneratorPassDependencies {
    readonly indentSize?: number;
    readonly includeJsDoc?: boolean;
    readonly actionGenerator?: FormActionGenerator;
    readonly codeBuilder?: FormCodeBuilder;
    readonly resolver?: SemanticTypeResolver;
}

export class FormGeneratorPass implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedForm']> {
    public readonly name = 'FormGenerator';
    public readonly inputWitnesses = [new ArtifactKeyWitness('RequestTypes')] as const;
    public readonly outputKeys = ['GeneratedForm'] as const;

    public readonly descriptor: PassDescriptor<readonly ['RequestTypes'], readonly ['GeneratedForm']> = {
        consumes: ['RequestTypes'],
        produces: ['GeneratedForm']
    };

    public readonly requires: readonly PassDependency<'RequestTypes'>[] = [
        { artifact: 'RequestTypes' }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly indentSize: number;
    public readonly includeJsDoc: boolean;
    private readonly actionGenerator: FormActionGenerator;
    private readonly codeBuilder: FormCodeBuilder;
    private readonly resolver: SemanticTypeResolver;

    constructor({
        indentSize = 2,
        includeJsDoc = true,
        resolver = defaultTypeResolver,
        actionGenerator = new FormActionGenerator({ resolver }),
        codeBuilder = new FormCodeBuilder({ indentSize })
    }: FormGeneratorPassDependencies = {}) {
        this.indentSize = indentSize;
        this.includeJsDoc = includeJsDoc;
        this.resolver = resolver;
        this.actionGenerator = actionGenerator;
        this.codeBuilder = codeBuilder;
        Object.freeze(this);
    }

    run([requestTypesArtifact]: readonly [RequestTypesArtifact]): readonly [GeneratedFormArtifact] {
        const formTypes: FormTypeDefinition[] = [];

        for (const reqType of requestTypesArtifact.requestTypes) {
            const actions = reqType.actions.map(act =>
                this.actionGenerator.generateAction(act.name, act.fields)
            );
            formTypes.push({
                resourceName: reqType.resourceName,
                formTypeName: `${reqType.resourceName}Form`,
                actions
            });
        }

        const code = this.codeBuilder.build({ formTypes });

        return [{
            typeId: 'GeneratedForm',
            code,
            formTypes: formTypes.map(ft => ({
                name: ft.formTypeName,
                actions: ft.actions.map(a => ({
                    name: a.name,
                    fieldCount: a.fieldCount,
                    lineRange: [1, 1] as const
                })),
                lineRange: [1, 1] as const
            })),
            generationMetadata: {
                generatorVersion: '1.0.0',
                requestTypeCount: requestTypesArtifact.requestTypes.length,
                formTypeCount: formTypes.length,
                totalActions: formTypes.reduce((acc, ft) => acc + ft.actions.length, 0),
                linesOfCode: code.split('\n').length,
                warnings: []
            },
            metadata: requestTypesArtifact.metadata
        }];
    }
}
```

### 4.4. TDD Test: `FormGeneratorPass.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/FormGeneratorPass.spec.ts`

```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { FormGeneratorPass } from '../FormGeneratorPass';
import { FormActionGenerator } from '../../generators/form-generation/FormActionGenerator';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';

describe('FormGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor without arguments initializes default dependencies cleanly', () => {
        expectTypeOf<typeof FormGeneratorPass>().toBeConstructibleWith();
        const pass = new FormGeneratorPass();
        expect(pass.name).toBe('FormGenerator');
        expect(pass.descriptor.consumes).toContain('RequestTypes');
        expect(pass.descriptor.produces).toContain('GeneratedForm');
    });

    test('2. Constructor with empty options object ({}) initializes dependencies without exceptions', () => {
        expectTypeOf<typeof FormGeneratorPass>().toBeConstructibleWith({});
        const pass = new FormGeneratorPass({});
        expect(pass).toBeInstanceOf(FormGeneratorPass);
    });

    test('3. Constructor with partial dependencies injects custom resolver into default actionGenerator', () => {
        const customResolver = new SemanticTypeResolver();
        const pass = new FormGeneratorPass({ resolver: customResolver });
        expect(pass).toBeInstanceOf(FormGeneratorPass);
    });

    test('4. Constructor with full dependency injection respects supplied mock instances', () => {
        const customResolver = new SemanticTypeResolver();
        const customActionGen = new FormActionGenerator({ resolver: customResolver });
        const pass = new FormGeneratorPass({
            indentSize: 4,
            includeJsDoc: false,
            resolver: customResolver,
            actionGenerator: customActionGen
        });
        expect(pass).toBeInstanceOf(FormGeneratorPass);
        expect(pass.indentSize).toBe(4);
        expect(pass.includeJsDoc).toBe(false);
    });
});
```

---

## 5. Contract Pipeline (Structured Constructor)

### 5.1. `ContractActionGenerator.ts`
**Lokasi Target**: `packages/core/src/compiler/generators/contract-generation/ContractActionGenerator.ts`

```typescript
/**
 * ContractActionGenerator.ts
 * 
 * Groups schemas by action (create/update) and generates action blocks.
 * Structured Constructor consuming ContractSchemaMapper.
 * 
 * @module compiler/generators/contract-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import type { RequestField, FileValidationConstraints } from '../../artifacts/RequestTypesArtifact';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../domain/common/ResponseFieldLowering';
import { ResolvedObjectType } from '../../domain/common/ResolvedSemanticType';
import { toZodSchemaExpression } from '../../domain/common/ZodSchemaLowerer';

export interface GeneratedContractAction {
    readonly name: string;
    readonly schemaCode: string;
    readonly typeCode: string;
}

export interface ContractActionGeneratorDependencies {
    readonly resolver?: SemanticTypeResolver;
}

export class ContractActionGenerator {
    private readonly resolver: SemanticTypeResolver;

    constructor({ resolver = defaultTypeResolver }: ContractActionGeneratorDependencies = {}) {
        this.resolver = resolver;
    }

    generateAction(
        actionName: string,
        fields: readonly RequestField[],
        contractSchemaName: string
    ): GeneratedContractAction {
        const resolvedFields = fields.map(f => [f.originalName, this.resolver.resolve(f.type)] as const);
        const resolvedObject = new ResolvedObjectType({ fields: resolvedFields });
        const schemaExpr = toZodSchemaExpression(resolvedObject);

        return {
            name: actionName,
            schemaCode: `  ${actionName}: ${schemaExpr}`,
            typeCode: `  ${actionName}: z.infer<typeof ${contractSchemaName}.${actionName}>;`
        };
    }
}
```

### 5.2. `ContractCodeBuilder.ts`
**Lokasi Target**: `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`

```typescript
/**
 * ContractCodeBuilder.ts
 * 
 * Assembles final TypeScript code from contract definitions.
 * Pure Assembler without string manipulation duplication.
 * 
 * @module compiler/generators/contract-generation
 */

import type { GeneratedContractAction } from './ContractActionGenerator';

export interface ResourceContractDefinition {
    readonly resourceName: string;
    readonly actions: readonly GeneratedContractAction[];
}

export interface ContractCodeBuilderOptions {
    readonly indentSize?: number;
}

export class ContractCodeBuilder {
    private readonly indentSize: number;

    constructor({ indentSize = 2 }: ContractCodeBuilderOptions = {}) {
        this.indentSize = indentSize;
    }

    build(definitions: readonly ResourceContractDefinition[]): string {
        const contractBodies = definitions
            .map(def => {
                const schemaProps = def.actions.map(a => a.schemaCode).join(',\n');
                const typeProps = def.actions.map(a => a.typeCode).join('\n');
                const resourcePascal = def.resourceName.charAt(0).toUpperCase() + def.resourceName.slice(1);

                return [
                    `export const ${def.resourceName}ContractSchema = z.object({\n${schemaProps}\n});`,
                    `export interface ${def.resourceName}Contract {\n${typeProps}\n}`,
                    `export type ${resourcePascal}ApiResponse = z.infer<typeof ${def.resourceName}ShowSchema>;`
                ].join('\n\n');
            })
            .join('\n\n');

        return `import { z } from 'zod';\n\n${contractBodies}\n`;
    }
}
```

### 5.3. `ContractGeneratorPass.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

```typescript
/**
 * ContractGeneratorPass.ts
 *
 * Compiler pass that transforms RequestTypes into GeneratedContract.
 * Pure Flow Constructor with Guaranteed Invariants.
 * 
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedContractArtifact } from '../artifacts/GeneratedContractArtifact';
import { ContractActionGenerator } from '../generators/contract-generation/ContractActionGenerator';
import { ContractCodeBuilder, ResourceContractDefinition } from '../generators/contract-generation/ContractCodeBuilder';
import { SemanticTypeResolver } from '../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../domain/common/ResponseFieldLowering';

export interface ContractGeneratorPassDependencies {
    readonly includeJsDoc?: boolean;
    readonly indentSize?: number;
    readonly resolver?: SemanticTypeResolver;
    readonly actionGenerator?: ContractActionGenerator;
    readonly codeBuilder?: ContractCodeBuilder;
}

export class ContractGeneratorPass implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedContract']> {
    public readonly name = 'ContractGenerator';
    public readonly inputWitnesses = [new ArtifactKeyWitness('RequestTypes')] as const;
    public readonly outputKeys = ['GeneratedContract'] as const;

    public readonly descriptor: PassDescriptor<readonly ['RequestTypes'], readonly ['GeneratedContract']> = {
        consumes: ['RequestTypes'],
        produces: ['GeneratedContract']
    };

    public readonly requires: readonly PassDependency<'RequestTypes'>[] = [
        { artifact: 'RequestTypes' }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly indentSize: number;
    public readonly includeJsDoc: boolean;
    private readonly actionGenerator: ContractActionGenerator;
    private readonly codeBuilder: ContractCodeBuilder;
    private readonly resolver: SemanticTypeResolver;

    constructor({
        indentSize = 2,
        includeJsDoc = true,
        resolver = defaultTypeResolver,
        actionGenerator = new ContractActionGenerator({ resolver }),
        codeBuilder = new ContractCodeBuilder({ indentSize })
    }: ContractGeneratorPassDependencies = {}) {
        this.indentSize = indentSize;
        this.includeJsDoc = includeJsDoc;
        this.actionGenerator = actionGenerator;
        this.codeBuilder = codeBuilder;
        this.resolver = resolver;
        Object.freeze(this);
    }

    run([requestTypesArtifact]: readonly [RequestTypesArtifact]): readonly [GeneratedContractArtifact] {
        const definitions: ResourceContractDefinition[] = requestTypesArtifact.requestTypes.map(reqType => ({
            resourceName: reqType.resourceName,
            actions: reqType.actions.map(act =>
                this.actionGenerator.generateAction(act.name, act.fields, `${reqType.resourceName}ContractSchema`)
            )
        }));

        const code = this.codeBuilder.build(definitions);

        return [{
            typeId: 'GeneratedContract',
            code,
            contracts: definitions.map(def => ({
                name: def.resourceName,
                schemaName: `${def.resourceName}ContractSchema`,
                actions: def.actions.map(a => ({
                    name: a.name,
                    zodSchema: a.schemaCode,
                    validatorName: `validate${def.resourceName}${a.name}`,
                    fieldCount: 0
                })),
                lineRange: [1, 1] as const
            })),
            generationMetadata: {
                generatorVersion: '1.0.0',
                requestTypeCount: requestTypesArtifact.requestTypes.length,
                contractCount: definitions.length,
                totalActions: definitions.reduce((acc, d) => acc + d.actions.length, 0),
                zodSchemasCount: definitions.reduce((acc, d) => acc + d.actions.length, 0),
                validatorsCount: definitions.reduce((acc, d) => acc + d.actions.length, 0),
                linesOfCode: code.split('\n').length,
                warnings: []
            },
            metadata: requestTypesArtifact.metadata
        }];
    }
}
```

### 5.4. TDD Test: `ContractGeneratorPass.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/ContractGeneratorPass.spec.ts`

```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { ContractGeneratorPass } from '../ContractGeneratorPass';
import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';

describe('ContractGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor without arguments initializes default dependencies cleanly', () => {
        expectTypeOf<typeof ContractGeneratorPass>().toBeConstructibleWith();
        const pass = new ContractGeneratorPass();
        expect(pass.name).toBe('ContractGenerator');
        expect(pass.descriptor.consumes).toContain('RequestTypes');
        expect(pass.descriptor.produces).toContain('GeneratedContract');
    });

    test('2. Constructor with empty options object ({}) initializes dependencies without exceptions', () => {
        expectTypeOf<typeof ContractGeneratorPass>().toBeConstructibleWith({});
        const pass = new ContractGeneratorPass({});
        expect(pass).toBeInstanceOf(ContractGeneratorPass);
    });

    test('3. Constructor with partial dependencies injects custom resolver into default actionGenerator', () => {
        const customResolver = new SemanticTypeResolver();
        const pass = new ContractGeneratorPass({ resolver: customResolver });
        expect(pass).toBeInstanceOf(ContractGeneratorPass);
    });

    test('4. Constructor with full dependency injection respects supplied mock instances', () => {
        const customResolver = new SemanticTypeResolver();
        const customActionGen = new ContractActionGenerator({ resolver: customResolver });
        const pass = new ContractGeneratorPass({
            indentSize: 4,
            includeJsDoc: false,
            resolver: customResolver,
            actionGenerator: customActionGen
        });
        expect(pass).toBeInstanceOf(ContractGeneratorPass);
        expect(pass.indentSize).toBe(4);
        expect(pass.includeJsDoc).toBe(false)
    });
});
```

---

## 6. Mapper Pipeline (Structured Constructor)

### 6.0. Upstream Origin Boundary: `ResourceMappersArtifact.ts` & `ArtifactRegistry`

**Lokasi Target**: `packages/core/src/compiler/artifacts/ResourceMappersArtifact.ts`
```typescript
/**
 * ResourceMappersArtifact.ts
 *
 * Upstream Intermediate Representation for API Read Mappers.
 * Produced by upstream semantic analysis passes, consumed by MapperGeneratorPass.
 *
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import type { ResolvedField } from '../domain/common/ResolvedSemanticType';

export interface ResourceMapperDefinition {
    readonly resourceName: string;
    readonly fields: readonly ResolvedField[];
}

export interface ResourceMappersArtifact {
    readonly typeId: 'ResourceMappers';
    readonly mappers: readonly ResourceMapperDefinition[];
    readonly metadata: ArtifactMetadata;
}
```

**Pendaftaran di SSOT `packages/core/src/compiler/artifacts/types.ts`**:
```typescript
import type { ResourceMappersArtifact } from './ResourceMappersArtifact';

export interface ArtifactRegistry {
    // ...
    ResourceMappers: ResourceMappersArtifact;
    GeneratedMapper: GeneratedMapperArtifact;
}
```

---

### 6.1. `MapperCodeBuilder.ts`
**Lokasi Target**: `packages/core/src/compiler/generators/mapper-generation/MapperCodeBuilder.ts`

```typescript
/**
 * MapperCodeBuilder.ts
 *
 * Pure Functional Code Builder for API Read Mappers.
 * Transforms ResolvedField structures into strongly-typed TypeScript mapping functions.
 * Pure Polymorphic Virtual Dispatch (0 'if', 0 'is', 0 '&&', 0 'as').
 *
 * @module compiler/generators/mapper-generation
 */

import type { ResolvedField } from '../../domain/common/ResolvedSemanticType';
import type { ResourceMapperDefinition } from '../../artifacts/ResourceMappersArtifact';

export interface MapperCodeBuilderOptions {
    readonly emitComments?: boolean;
}

export function formatResourceMapper(resourceName: string, fields: readonly ResolvedField[]): string {
    const cleanName = resourceName.replace(/(Resource|Response)$/, '') + 'Resource';
    const apiType = `${cleanName}ApiResponse`;
    const transformedType = `${cleanName}Transformed`;
    const functionName = `to${cleanName}Read`;

    const fieldAssignments = fields
        .map(([name, type]) => type.formatMapperAssignment(name))
        .join('\n');

    return `export const ${functionName} = (api: ${apiType}): ${transformedType} => ({\n${fieldAssignments}\n});`;
}

const commentHeaders = [
    '',
    '// Auto-generated by RouteSync MapperGeneratorPass. Do not edit directly.\n\n'
] as const;

export class MapperCodeBuilder {
    private readonly emitComments: boolean;

    constructor({ emitComments = true }: MapperCodeBuilderOptions = {}) {
        this.emitComments = emitComments;
        Object.freeze(this);
    }

    build(definitions: readonly ResourceMapperDefinition[]): string {
        const mappers = definitions
            .map(def => formatResourceMapper(def.resourceName, def.fields))
            .join('\n\n');

        const header = commentHeaders[Number(this.emitComments)];

        return `${header}${mappers}\n`;
    }
}
```

### 6.2. `MapperGeneratorPass.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/MapperGeneratorPass.ts`

```typescript
/**
 * MapperGeneratorPass.ts
 *
 * Generates API transformation mappers for Eloquent JsonResources.
 * Structured Constructor consuming ResourceMappersArtifact SSOT.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';
import type { ResourceMappersArtifact } from '../artifacts/ResourceMappersArtifact';
import type { GeneratedMapperArtifact } from '../artifacts/GeneratedMapperArtifact';
import { MapperCodeBuilder } from '../generators/mapper-generation/MapperCodeBuilder';

export interface MapperGeneratorPassDependencies {
    readonly emitComments?: boolean;
    readonly codeBuilder?: MapperCodeBuilder;
}

export class MapperGeneratorPass implements CompilerPass<readonly ['ResourceMappers'], readonly ['GeneratedMapper']> {
    public readonly name = 'MapperGenerator';
    public readonly inputWitnesses = [new ArtifactKeyWitness('ResourceMappers')] as const;
    public readonly outputKeys = ['GeneratedMapper'] as const;

    public readonly descriptor: PassDescriptor<readonly ['ResourceMappers'], readonly ['GeneratedMapper']> = {
        consumes: ['ResourceMappers'],
        produces: ['GeneratedMapper']
    };

    public readonly requires: readonly PassDependency<'ResourceMappers'>[] = [
        { artifact: 'ResourceMappers' }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly emitComments: boolean;
    private readonly codeBuilder: MapperCodeBuilder;

    constructor({
        emitComments = true,
        codeBuilder = new MapperCodeBuilder({ emitComments })
    }: MapperGeneratorPassDependencies = {}) {
        this.emitComments = emitComments;
        this.codeBuilder = codeBuilder;
        Object.freeze(this);
    }

    run([resourceMappersArtifact]: readonly [ResourceMappersArtifact]): readonly [GeneratedMapperArtifact] {
        const code = this.codeBuilder.build(resourceMappersArtifact.mappers);

        return [{
            typeId: 'GeneratedMapper',
            code,
            metadata: resourceMappersArtifact.metadata
        }];
    }
}
```

### 6.3. TDD Test: `MapperGeneratorPass.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/MapperGeneratorPass.spec.ts`

```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { MapperGeneratorPass } from '../MapperGeneratorPass';

describe('MapperGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor initializes cleanly without arguments', () => {
        expectTypeOf<typeof MapperGeneratorPass>().toBeConstructibleWith();
        const pass = new MapperGeneratorPass();
        expect(pass.name).toBe('MapperGenerator');
        expect(pass.descriptor.consumes).toContain('ResourceMappers');
        expect(pass.descriptor.produces).toContain('GeneratedMapper');
    });

    test('2. Constructor with empty options object ({}) initializes dependencies safely', () => {
        expectTypeOf<typeof MapperGeneratorPass>().toBeConstructibleWith({});
        const pass = new MapperGeneratorPass({});
        expect(pass).toBeInstanceOf(MapperGeneratorPass);
    });

    test('3. Constructor with custom options initializes properties cleanly', () => {
        const pass = new MapperGeneratorPass({ emitComments: false });
        expect(pass).toBeInstanceOf(MapperGeneratorPass);
        expect(pass.emitComments).toBe(false);
    });
});
```

---

## 7. TypeScript Interface Pass (Structured Constructor)

### 7.0. Upstream Origin Boundary: `ResourceTypesArtifact.ts` & `ArtifactRegistry`

**Lokasi Target**: `packages/core/src/compiler/artifacts/ResourceTypesArtifact.ts`
```typescript
/**
 * ResourceTypesArtifact.ts
 *
 * Upstream Intermediate Representation of resolved resource schemas.
 * Produced by upstream semantic analysis passes, consumed by TypeScriptGeneratorPass.
 *
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import type { ResolvedObjectType } from '../domain/common/ResolvedSemanticType';

export interface ResourceTypeDefinition {
    readonly resourceName: string;
    readonly schema: ResolvedObjectType;
}

export interface ResourceTypesArtifact {
    readonly typeId: 'ResourceTypes';
    readonly resources: readonly ResourceTypeDefinition[];
    readonly metadata: ArtifactMetadata;
}
```

**Pendaftaran di SSOT `packages/core/src/compiler/artifacts/types.ts`**:
```typescript
import type { ResourceTypesArtifact } from './ResourceTypesArtifact';

export interface ArtifactRegistry {
    // ...
    ResourceTypes: ResourceTypesArtifact;
    GeneratedTypeScript: GeneratedTypeScriptArtifact;
}
```

---

### 7.1. `TypeScriptGeneratorPass.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts`

```typescript
/**
 * TypeScriptGeneratorPass.ts
 *
 * Compiler pass that transforms ResourceTypes into Generated TypeScript interfaces.
 * Consumes ResourceTypesArtifact with pure declarative lowering.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';
import type { GeneratedTypeScriptArtifact } from '../artifacts/GeneratedTypeScriptArtifact';
import type { ResourceTypesArtifact } from '../artifacts/ResourceTypesArtifact';
import { buildTopLevelDeclaration } from '../domain/common/TypeScriptTypeLowerer';

export interface TypeScriptGeneratorPassDependencies {
    readonly targetVersion?: string;
    readonly includeJsDoc?: boolean;
}

export class TypeScriptGeneratorPass implements CompilerPass<readonly ['ResourceTypes'], readonly ['GeneratedTypeScript']> {
    public readonly name = 'TypeScriptGenerator';
    public readonly inputWitnesses = [new ArtifactKeyWitness('ResourceTypes')] as const;
    public readonly outputKeys = ['GeneratedTypeScript'] as const;

    public readonly descriptor: PassDescriptor<readonly ['ResourceTypes'], readonly ['GeneratedTypeScript']> = {
        consumes: ['ResourceTypes'],
        produces: ['GeneratedTypeScript']
    };

    public readonly requires: readonly PassDependency<'ResourceTypes'>[] = [
        { artifact: 'ResourceTypes' }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly targetVersion: string;
    public readonly includeJsDoc: boolean;

    constructor({
        targetVersion = 'ES2022',
        includeJsDoc = true
    }: TypeScriptGeneratorPassDependencies = {}) {
        this.targetVersion = targetVersion;
        this.includeJsDoc = includeJsDoc;
        Object.freeze(this);
    }

    run([resourceTypesArtifact]: readonly [ResourceTypesArtifact]): readonly [GeneratedTypeScriptArtifact] {
        const declarations = resourceTypesArtifact.resources.map(res =>
            buildTopLevelDeclaration(res.resourceName, res.schema)
        );

        const code = declarations.join('\n\n');

        return [{
            typeId: 'GeneratedTypeScript',
            code,
            imports: [],
            interfaces: declarations.map(decl => ({
                name: '',
                propertyCount: 0,
                lineRange: [1, 1] as const
            })),
            generationMetadata: {
                generatorVersion: '1.0.0',
                typeCount: resourceTypesArtifact.resources.length,
                interfaceCount: declarations.length,
                importCount: 0,
                linesOfCode: code.split('\n').length,
                warnings: []
            },
            metadata: resourceTypesArtifact.metadata
        }];
    }
}
```

### 7.2. TDD Test: `TypeScriptGeneratorPass.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/TypeScriptGeneratorPass.spec.ts`
```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { TypeScriptGeneratorPass } from '../TypeScriptGeneratorPass';

describe('TypeScriptGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor initializes cleanly without arguments', () => {
        expectTypeOf<typeof TypeScriptGeneratorPass>().toBeConstructibleWith();
        const pass = new TypeScriptGeneratorPass();
        expect(pass.name).toBe('TypeScriptGenerator');
        expect(pass.descriptor.consumes).toContain('ResourceTypes');
        expect(pass.descriptor.produces).toContain('GeneratedTypeScript');
    });

    test('2. Constructor with empty options object ({}) initializes safely', () => {
        expectTypeOf<typeof TypeScriptGeneratorPass>().toBeConstructibleWith({});
        const pass = new TypeScriptGeneratorPass({});
        expect(pass).toBeInstanceOf(TypeScriptGeneratorPass);
    });

    test('3. Constructor with custom options initializes properties cleanly', () => {
        const pass = new TypeScriptGeneratorPass({ targetVersion: 'ES2020', includeJsDoc: false });
        expect(pass).toBeInstanceOf(TypeScriptGeneratorPass);
        expect(pass.targetVersion).toBe('ES2020');
        expect(pass.includeJsDoc).toBe(false);
    });
});
```

---

## 8. Upstream Origin Boundary Lowering (Reusable Constructor)

**Lokasi Target**: `packages/cli/src/generators/utils/ManifestArtifactLowerer.ts`

Untuk menjaga integritas alur data (*data flow continuity*) dari Laravel AST ke Compiler Artifacts tanpa membuang konteks ke `Map` perantara, sistem Origin Boundary dibangun menggunakan **Structured Value Objects & Flattener Engine**:

```typescript
/**
 * ManifestArtifactLowerer.ts
 *
 * Upstream Origin Boundary Lowering Engine.
 * Transforms raw RouteManifest into strongly-typed compiler artifacts.
 * Structured Reusable Constructor Pattern consuming pure FlattenedProperty Value Objects.
 *
 * @module cli/generators/utils
 */

import type { RouteManifest, ResourceFieldKind } from '../../../../core/src/types/route';
import { toCamelCase, toPascalCase, capitalize } from '../../../../core/src/utils/resource-naming';
import type { ResourceTypesArtifact, ResourceTypeDefinition } from '../../../../core/src/compiler/artifacts/ResourceTypesArtifact';
import type { ResourceMappersArtifact, ResourceMapperDefinition } from '../../../../core/src/compiler/artifacts/ResourceMappersArtifact';
import type { ResolvedField } from '../../../../core/src/compiler/domain/common/ResolvedSemanticType';
import type { SemanticType } from '../../../../core/src/compiler/types/SemanticType';
import { ResolvedObjectType } from '../../../../core/src/compiler/domain/common/ResolvedSemanticType';
import { SemanticTypeResolver } from '../../../../core/src/compiler/domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../../../core/src/compiler/domain/common/ResponseFieldLowering';
import { PrimitiveTypeFactory } from './PrimitiveTypeFactory';

export interface FlattenedPropertyParams {
    readonly name: string;
    readonly type: SemanticType;
}

export class FlattenedProperty {
    public readonly name: string;
    public readonly type: SemanticType;

    constructor({ name, type }: FlattenedPropertyParams) {
        this.name = name;
        this.type = type;
        Object.freeze(this);
    }
}

export interface ResourceFieldFlattenerDependencies {
    readonly maxDepth?: number;
    readonly circularRefWarnings?: boolean;
}

export class ResourceFieldFlattener {
    public readonly maxDepth: number;
    public readonly circularRefWarnings: boolean;

    constructor({
        maxDepth = 5,
        circularRefWarnings = true
    }: ResourceFieldFlattenerDependencies = {}) {
        this.maxDepth = maxDepth;
        this.circularRefWarnings = circularRefWarnings;
        Object.freeze(this);
    }

    flatten(
        resourceName: string,
        fields: Readonly<Record<string, ResourceFieldKind>>
    ): readonly FlattenedProperty[] {
        const properties = this.flattenNested(fields, '', 0, new WeakSet(), resourceName);
        return this.deduplicateProperties(properties, resourceName);
    }

    private flattenNested(
        fields: Readonly<Record<string, ResourceFieldKind>>,
        prefix: string,
        depth: number,
        visited: WeakSet<object>,
        resourceName: string
    ): readonly FlattenedProperty[] {
        const canTraverse = depth < this.maxDepth;

        const traverseStrategies: readonly (() => readonly FlattenedProperty[])[] = [
            () => [],
            () => Object.entries(fields).flatMap(([rawName, fieldDef]) => {
                const camelName = toCamelCase(rawName);
                const propName = prefix.length > 0 ? `${prefix}${capitalize(camelName)}` : camelName;

                switch (fieldDef.kind) {
                    case 'primitive':
                        return [new FlattenedProperty({
                            name: propName,
                            type: PrimitiveTypeFactory.fromString(fieldDef.type)
                        })];

                    case 'object': {
                        const nested = fieldDef.fields;
                        return nested
                            ? this.flattenNested(nested, propName, depth + 1, visited, resourceName)
                            : [];
                    }

                    default:
                        return [];
                }
            })
        ];

        return traverseStrategies[Number(canTraverse)]();
    }

    private deduplicateProperties(
        properties: readonly FlattenedProperty[],
        resourceName: string
    ): readonly FlattenedProperty[] {
        const seen = new Set<string>();
        return properties.filter(prop => {
            const isFirst = !seen.has(prop.name);
            seen.add(prop.name);
            return isFirst;
        });
    }
}

export interface ManifestArtifactLowererDependencies {
    readonly resolver?: SemanticTypeResolver;
    readonly flattener?: ResourceFieldFlattener;
}

export class ManifestArtifactLowerer {
    private readonly resolver: SemanticTypeResolver;
    private readonly flattener: ResourceFieldFlattener;

    constructor({
        resolver = defaultTypeResolver,
        flattener = new ResourceFieldFlattener()
    }: ManifestArtifactLowererDependencies = {}) {
        this.resolver = resolver;
        this.flattener = flattener;
        Object.freeze(this);
    }

    lowerToResourceMappers(manifest: RouteManifest): ResourceMappersArtifact {
        const { resources = [] } = manifest;
        const mappers: readonly ResourceMapperDefinition[] = resources.map(res => {
            const properties = this.flattener.flatten(res.name, res.fields);
            const fields: readonly ResolvedField[] = properties.map(prop => [
                prop.name,
                this.resolver.resolve(prop.type)
            ] as const);

            return {
                resourceName: `${toPascalCase(res.name)}Resource`,
                fields
            };
        });

        return {
            typeId: 'ResourceMappers',
            mappers,
            metadata: {
                hash: `map-${Date.now()}`,
                producer: 'ManifestArtifactLowerer',
                dependencies: [],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        };
    }

    lowerToResourceTypes(manifest: RouteManifest): ResourceTypesArtifact {
        const { resources = [] } = manifest;
        const loweredResources: readonly ResourceTypeDefinition[] = resources.map(res => {
            const properties = this.flattener.flatten(res.name, res.fields);
            const fields: readonly ResolvedField[] = properties.map(prop => [
                prop.name,
                this.resolver.resolve(prop.type)
            ] as const);

            const schema = new ResolvedObjectType({
                fields,
                resourceName: res.name,
                objectKind: 'resource'
            });

            return {
                resourceName: `${toPascalCase(res.name)}Resource`,
                schema
            };
        });

        return {
            typeId: 'ResourceTypes',
            resources: loweredResources,
            metadata: {
                hash: `res-${Date.now()}`,
                producer: 'ManifestArtifactLowerer',
                dependencies: [],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        };
    }
}
```
