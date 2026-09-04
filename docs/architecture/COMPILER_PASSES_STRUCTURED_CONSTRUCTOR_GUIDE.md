# RouteSync Compiler Passes — Structured Constructor & Flow-Based Architecture Guide

Panduan master kode produksi dan spesifikasi pengujian Vitest TDD untuk seluruh pass compiler yang tersisa di `packages/core/src/compiler`.

Semua modul di bawah ini mengikuti standar baku:
- ❌ **0 `if` statements** & **0 `else` branches**.
- ❌ **0 `??`** dan **0 `?.`** (Defensive fallbacks dihilangkan; resolusi terjadi di Origin Boundary).
- ❌ **0 `? :`** (Ternary conditionals dihilangkan; digantikan oleh Table-Driven Dispatch / Virtual Polymorphism).
- ❌ **0 operator spread (`...`)**.
- ✅ **Flat Flow Signature Parameter Destructuring Defaults**.
- ✅ **100% Immutable (`Object.freeze(this)`)**.
- ✅ **100% Copy-Paste Ready untuk Codebase RouteSync**.

---

## 1. Response Analysis Pipeline (Structured Constructor)

### 1.0. Perbaikan Hulu (*Upstream Origin Boundary*): `packages/core/src/types/route.ts`
**Lokasi Target**: `packages/core/src/types/route.ts`

Di hulu (*Origin Boundary*), definisikan Value Object Type Family `ResponseDescriptor` dan perbarui `ParsedRoute.response` agar memegang `ResponseDescriptor` yang terjamin (bukan lagi `ResponseMetadata | undefined` mentah):

```typescript
import { SemanticResolution } from './contract';
import { ManifestMetadata } from './ir';
import { SemanticType } from './semantic';
import type { ResponseBody } from '../compiler/ir/ResponseArtifact';

/**
 * Resolved domain intent config, produced by `IntentResolver` and consumed at runtime by
 * `defineHooks()` (see `@routesync/react`). A domain entry starts life as either a plain string
 * shorthand (`"cart"`) authored by hand in `routesync.manifest.json`, or gets replaced in-place
 * by `IntentResolver.resolve()` with the fully-resolved object shape below. The `string` variant
 * is kept in the union for backward compatibility with hand-authored manifests written before
 * `IntentResolver` existed.
 */
export interface DomainIntentConfig {
  type: string;
  operations: Record<string, string>;
  config: Record<string, string>;
}

export interface PageConfig {
  component?: string;
  layout?: string;
  props?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface RouteManifest {
  version: string;
  baseURL: string;
  routes: ParsedRoute[];
  channels?: ParsedChannel[];
  models?: ParsedModel[];
  resources?: ParsedResource[];
  generatedAt: string;
  frontend?: {
    router?: string;
    groupAliases?: Record<string, string>;
    domains?: Record<string, string | DomainIntentConfig>;
  };
  pages?: Record<string, PageConfig>;
}

export interface ParsedChannel {
  name: string;
  isPrivate: boolean;
  isPresence: boolean;
}

export type ResourceFieldKind = (
  | { kind: 'primitive'; type: string }
  | { kind: 'model'; model: string; collection: boolean }
  | { kind: 'resource'; resource: string; model?: string; collection: boolean }
  | { kind: 'object'; fields: Record<string, ResourceFieldKind> }
  | { kind: 'array'; element: ResourceFieldKind }
  | { kind: 'property_access'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'nullsafe_property_access'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'variable'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'type_cast'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'binary_expression'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'method_call'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'static_method_call'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'literal'; resolved?: { type: string }; nullable?: boolean }
  | { kind: 'unknown' }
) & {
  resolved?: SemanticResolution;
  semantic?: SemanticResolution;
  /** Whether this field can be null in the response payload. */
  nullable?: boolean;
  /** A paginator serializes as an object containing a collection in `data`. */
  paginated?: boolean;
};

export interface ParsedResource {
  name: string;
  sanitizedName?: string;
  baseModel?: string;
  actions?: ActionDefinition[];
  endpoints?: string[];
  fields: Record<string, ResourceFieldKind>;
  assignments?: Record<string, string>;
  sourceFile?: string | null;
  sourceLine?: number | null;
  isSynthetic?: boolean;
}

export interface ActionDefinition {
  name: string;
  method: string;
  hasBody: boolean;
  hasResponse: boolean;
  routes: string[];
}

export type ResponseMetadata = (
  | { kind: 'model'; model: string; collection: boolean; paginated?: boolean }
  | { kind: 'resource'; resource: string; collection: boolean; paginated?: boolean }
  | { kind: 'object'; fields: Record<string, ResponseMetadata | ResourceFieldKind>; collection?: boolean; paginated?: boolean }
  | { kind: 'array'; element: ResourceFieldKind; paginated?: boolean }
  | { kind: 'unknown' }
) & {
  resolved?: SemanticResolution & { kind?: string; type?: string; fields?: Record<string, SemanticType>; wrapped?: boolean };
  semantic?: SemanticResolution & { kind?: string; type?: string; fields?: Record<string, SemanticType>; wrapped?: boolean };
  collection?: boolean;
  paginated?: boolean;
  type?: string;
  wrapped?: boolean;
};

export interface ParsedColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface ParsedModel {
  name: string;
  table: string;
  columns: ParsedColumn[];
  hidden?: string[];
  appends?: string[];
  casts?: Record<string, string>;
  accessors?: Record<string, any>;
  relations?: Record<string, { type: string; model: string }>;
}

export type ResponseShape = 'paginated' | 'collection' | 'single';

export interface RouteResponseAnalysis {
  readonly routeName: string;
  readonly responseType: string;
  readonly shape: ResponseShape;
  readonly resourceName?: string;
  readonly modelName?: string;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

export abstract class ResponseDescriptorBase {
  abstract readonly kind: string;
  abstract readonly shape: ResponseShape;

  abstract toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis;
  abstract toResponseBody(): ResponseBody;
}

export interface ResourceResponseParams {
  readonly resourceName?: string;
  readonly shape?: ResponseShape;
}

export class ResourceResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'resource' as const;
  public readonly shape: ResponseShape;
  public readonly resourceName: string;

  constructor({
    resourceName = 'UnknownResource',
    shape = 'single'
  }: ResourceResponseParams = {}) {
    super();
    this.resourceName = resourceName;
    this.shape = shape;
    Object.freeze(this);
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: this.resourceName,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'resource',
      resource: this.resourceName,
      shape: this.shape
    };
  }
}

export interface ModelResponseParams {
  readonly modelName?: string;
  readonly shape?: ResponseShape;
}

export class ModelResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'model' as const;
  public readonly shape: ResponseShape;
  public readonly modelName: string;

  constructor({
    modelName = 'UnknownModel',
    shape = 'single'
  }: ModelResponseParams = {}) {
    super();
    this.modelName = modelName;
    this.shape = shape;
    Object.freeze(this);
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      modelName: this.modelName,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'model',
      model: this.modelName,
      shape: this.shape
    };
  }
}

export class VoidResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'void' as const;
  public readonly shape = 'single' as const;

  constructor() {
    super();
    Object.freeze(this);
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'primitive',
      primitiveType: 'void',
      shape: 'single'
    };
  }
}

export type ResponseDescriptor =
  | ResourceResponseDescriptor
  | ModelResponseDescriptor
  | VoidResponseDescriptor;

export interface ParsedRoute {
  readonly name: string;
  readonly method: string;
  readonly path: string;
  readonly auth: boolean;
  readonly middleware: readonly string[];
  readonly response: ResponseDescriptor; // ◄── 100% Guaranteed Value Object!
  readonly schema?: Record<string, unknown>;
  readonly group?: string;
  readonly action?: string;
  readonly assignments?: Record<string, string>;
  readonly stableHash?: string;
  readonly sourceFile?: string | null;
  readonly sourceLine?: number | null;
  readonly uri?: string;
  readonly actionName?: string;
  readonly controllerName?: string;
}
```

---

### 1.1. Penambahan Tipe `'void'` pada IR: `packages/core/src/compiler/ir/ResponseArtifact.ts`
**Lokasi Target**: `packages/core/src/compiler/ir/ResponseArtifact.ts` (baris 177)
```typescript
export interface PrimitiveBody {
    readonly type: "primitive";
    readonly primitiveType: "string" | "number" | "boolean" | "null" | "void";

    /** Primitives always single */
    readonly shape: "single";
}
```

---

### 1.2. `ResponseAnalysisPass.ts` (Pure Direct Flow, 0 Perantara)
**Lokasi Target**: `packages/core/src/compiler/passes/ResponseAnalysisPass.ts`

```typescript
/**
 * ResponseAnalysisPass.ts
 *
 * Analyzes route response metadata and produces aggregate ResponseAnalysisArtifact.
 * Pure direct flow coordinator consuming strongly-typed route.response Value Objects.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { CompilationContext } from './CompilationContext';
import {
    ResponseArtifactBuilder,
    type ResponseArtifact,
    type ConfidenceScore
} from '../ir/ResponseArtifact';
import { ResponseAnalysisArtifact } from '../artifacts/ResponseAnalysisArtifact';
import type { ParsedRoute, ResponseDescriptor, RouteResponseAnalysis } from '../../types/route';

export interface ResponseAnalysisPassDependencies {
    readonly defaultConfidence?: number;
    readonly revision?: string;
}

export function analyzeRouteResponse(
    route: ParsedRoute,
    confidence: number
): RouteResponseAnalysis {
    return route.response.toAnalysis(route.name, confidence);
}

export function buildResponseArtifact(
    routeName: string,
    descriptor: ResponseDescriptor,
    confidenceScore: number,
    producerName: string,
    revision: string
): ResponseArtifact {
    const artifactId = `${routeName}.Response`;
    const responseBody = descriptor.toResponseBody();
    const confidence: ConfidenceScore = {
        score: confidenceScore,
        reasons: [
            `Response kind: ${descriptor.kind}`,
            `Response shape: ${descriptor.shape}`
        ],
        method: 'inferred'
    };

    return new ResponseArtifactBuilder()
        .id(artifactId)
        .body(responseBody)
        .confidence(confidence)
        .metadata({
            producer: producerName,
            dependencies: ['RouteManifest'],
            revision
        })
        .build();
}

export function computeAggregateHash(artifacts: ReadonlyMap<string, ResponseArtifact>): string {
    let acc = 0;
    for (const [id] of artifacts) {
        for (let i = 0; i < id.length; i++) {
            acc = (acc * 31 + id.charCodeAt(i)) >>> 0;
        }
    }
    return `resp_analysis_${acc.toString(16)}`;
}

export class ResponseAnalysisPass
    implements CompilerPass<readonly ['RouteManifest'], readonly ['ResponseAnalysis']> {

    public readonly name = 'ResponseAnalysis';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RouteManifest')
    ] as const;

    public readonly outputKeys = ['ResponseAnalysis'] as const;

    public readonly descriptor: PassDescriptor<
        readonly ['RouteManifest'],
        readonly ['ResponseAnalysis']
    > = {
            consumes: ['RouteManifest'],
            produces: ['ResponseAnalysis']
        };

    public readonly requires: readonly PassDependency<'RouteManifest'>[] = [
        { artifact: 'RouteManifest' }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly defaultConfidence: number;
    public readonly revision: string;

    constructor({
        defaultConfidence = 0.95,
        revision = '1.0.0'
    }: ResponseAnalysisPassDependencies = {}) {
        this.defaultConfidence = defaultConfidence;
        this.revision = revision;
        Object.freeze(this);
    }

    public async run(
        [routeManifestArtifact]: ResolveArtifacts<readonly ['RouteManifest']>,
        _context?: CompilationContext
    ): Promise<ResolveArtifacts<readonly ['ResponseAnalysis']>> {
        const responseArtifacts = new Map<string, ResponseArtifact>();

        for (const route of routeManifestArtifact.manifest.routes) {
            const artifact = buildResponseArtifact(route.name, route.response, this.defaultConfidence, this.name, this.revision);
            responseArtifacts.set(artifact.id, artifact);
        }

        const metadata = {
            hash: computeAggregateHash(responseArtifacts),
            producer: this.name,
            dependencies: ['RouteManifest'],
            timestamp: Date.now(),
            revision: this.revision
        } as const;

        return [
            new ResponseAnalysisArtifact(responseArtifacts, metadata)
        ];
    }
}
```

### 1.3. TDD Test: `ResponseAnalysisPass.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/ResponseAnalysisPass.spec.ts`

```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { ResponseAnalysisPass } from '../ResponseAnalysisPass';

describe('ResponseAnalysisPass Constructor TDD Specification', () => {
    test('1. Default constructor initializes cleanly without arguments', () => {
        expectTypeOf<typeof ResponseAnalysisPass>().toBeConstructibleWith();
        const pass = new ResponseAnalysisPass();
        expect(pass.name).toBe('ResponseAnalysis');
        expect(pass.defaultConfidence).toBe(0.95);
        expect(pass.revision).toBe('1.0.0');
        expect(pass.descriptor.consumes).toContain('RouteManifest');
        expect(pass.descriptor.produces).toContain('ResponseAnalysis');
    });

    test('2. Constructor with empty options object ({}) initializes defaults safely', () => {
        expectTypeOf<typeof ResponseAnalysisPass>().toBeConstructibleWith({});
        const pass = new ResponseAnalysisPass({});
        expect(pass).toBeInstanceOf(ResponseAnalysisPass);
        expect(pass.defaultConfidence).toBe(0.95);
    });

    test('3. Constructor with custom flat parameters initializes properties immutably', () => {
        const pass = new ResponseAnalysisPass({
            defaultConfidence: 0.85,
            revision: '2.0.0'
        });
        expect(pass.defaultConfidence).toBe(0.85);
        expect(pass.revision).toBe('2.0.0');
    });
});
```

---

## 2. API Field Pipeline (Structured Constructor)

### 2.1. `ApiFieldGeneratorPass.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/ApiFieldGeneratorPass.ts`

```typescript
/**
 * ApiFieldGeneratorPass.ts
 *
 * Compiler pass that collects unique field names across RequestTypes and generates api-field.ts constants.
 * Flow-based pipeline consuming pure domain operations.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, type ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedApiFieldArtifact } from '../artifacts/GeneratedApiFieldArtifact';
import {
    extractFieldNames,
    deduplicateFieldNames,
    formatApiFieldConstant,
    buildApiFieldArtifact
} from './api-field-domain';

export interface ApiFieldGeneratorPassDependencies {
    readonly exportConstName?: string;
}

export class ApiFieldGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedApiField']> {

    public readonly name = 'ApiFieldGenerator';

    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RequestTypes')
    ] as const;

    public readonly outputKeys = ['GeneratedApiField'] as const;

    public readonly descriptor: PassDescriptor<
        readonly ['RequestTypes'],
        readonly ['GeneratedApiField']
    > = {
            consumes: ['RequestTypes'],
            produces: ['GeneratedApiField']
        };

    public readonly requires: readonly PassDependency<'RequestTypes'>[] = [
        {
            artifact: 'RequestTypes'
        }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly exportConstName: string;

    constructor({
        exportConstName = 'API_FIELDS'
    }: ApiFieldGeneratorPassDependencies = {}) {
        this.exportConstName = exportConstName;
        Object.freeze(this);
    }

    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedApiField']> {
        const [requestTypesArtifact] = inputs;

        const extracted = extractFieldNames(requestTypesArtifact);
        const unique = deduplicateFieldNames(extracted);
        const code = formatApiFieldConstant(unique, this.exportConstName);
        const artifact = buildApiFieldArtifact(code, requestTypesArtifact.metadata);

        return [artifact];
    }
}
```

### 2.2. `api-field-domain.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/api-field-domain.ts`

```typescript
/**
 * api-field-domain.ts
 *
 * Pure Stage Operations for API Field Generation.
 * 0 spread operators, 0 procedural branching.
 *
 * @module compiler/passes
 */

import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedApiFieldArtifact } from '../artifacts/GeneratedApiFieldArtifact';
import type { ArtifactMetadata } from '../artifacts/Artifact';

export function extractFieldNames(artifact: RequestTypesArtifact): readonly string[] {
    return artifact.requestTypes
        .flatMap(rt => rt.actions)
        .flatMap(action => action.fields)
        .map(field => field.originalName);
}

export function deduplicateFieldNames(rawNames: readonly string[]): readonly string[] {
    return Array.from(new Set(rawNames));
}

export function formatApiFieldConstant(
    uniqueNames: readonly string[],
    exportConstName = 'API_FIELDS'
): string {
    const fieldEntries = uniqueNames
        .map(name => `  ${name}: '${name}'`)
        .join(',\n');

    return `export const ${exportConstName} = {\n${fieldEntries}\n} as const;\n\nexport type ApiField = typeof ${exportConstName}[keyof typeof ${exportConstName}];`;
}

export function buildApiFieldArtifact(
    code: string,
    metadata: ArtifactMetadata
): GeneratedApiFieldArtifact {
    return {
        typeId: 'GeneratedApiField',
        code,
        metadata
    };
}
```

### 2.3. TDD Test: `ApiFieldGeneratorPass.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/ApiFieldGeneratorPass.spec.ts`

```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { ApiFieldGeneratorPass } from '../ApiFieldGeneratorPass';

describe('ApiFieldGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor initializes cleanly without arguments', () => {
        expectTypeOf<typeof ApiFieldGeneratorPass>().toBeConstructibleWith();
        const pass = new ApiFieldGeneratorPass();
        expect(pass.name).toBe('ApiFieldGenerator');
        expect(pass.exportConstName).toBe('API_FIELDS');
    });

    test('2. Constructor with empty options object ({}) initializes defaults safely', () => {
        expectTypeOf<typeof ApiFieldGeneratorPass>().toBeConstructibleWith({});
        const pass = new ApiFieldGeneratorPass({});
        expect(pass).toBeInstanceOf(ApiFieldGeneratorPass);
        expect(pass.exportConstName).toBe('API_FIELDS');
    });

    test('3. Constructor with custom flat exportConstName sets property immutably', () => {
        const pass = new ApiFieldGeneratorPass({ exportConstName: 'CUSTOM_FIELDS' });
        expect(pass.exportConstName).toBe('CUSTOM_FIELDS');
    });
});
```

---

## 3. Compilation Context & State Pipeline

### 3.1. `CompilationContext.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/CompilationContext.ts`

```typescript
/**
 * CompilationContext.ts
 *
 * Encapsulates the environment and services for compiler pass execution.
 * Structured constructor with default factory dependencies.
 *
 * @module compiler/passes
 */

import { DiagnosticBag } from '../diagnostics/DiagnosticBag';

export interface CompilerOptions {
    readonly watch?: boolean;
    readonly strict?: boolean;
    readonly targetBackend?: string;
    readonly revision?: string;
}

export interface VirtualFileWriter {
    writeFile(path: string, content: string): void;
}

export class InMemoryFileWriter implements VirtualFileWriter {
    public readonly files = new Map<string, string>();

    writeFile(path: string, content: string): void {
        this.files.set(path, content);
    }
}

export interface CompilationContextDependencies {
    readonly diagnostics?: DiagnosticBag;
    readonly fileWriter?: VirtualFileWriter;
    readonly watch?: boolean;
    readonly strict?: boolean;
    readonly targetBackend?: string;
    readonly revision?: string;
}

export class CompilationContext {
    public readonly diagnostics: DiagnosticBag;
    public readonly fileWriter: VirtualFileWriter;
    public readonly watch: boolean;
    public readonly strict: boolean;
    public readonly targetBackend: string;
    public readonly revision: string;

    constructor({
        diagnostics = DiagnosticBag.createEmpty(),
        fileWriter = new InMemoryFileWriter(),
        watch = false,
        strict = true,
        targetBackend = 'typescript',
        revision = '1.0.0'
    }: CompilationContextDependencies = {}) {
        this.diagnostics = diagnostics;
        this.fileWriter = fileWriter;
        this.watch = watch;
        this.strict = strict;
        this.targetBackend = targetBackend;
        this.revision = revision;
        Object.freeze(this);
    }
}
```

### 3.2. TDD Test: `CompilationContext.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/CompilationContext.spec.ts`

```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { CompilationContext, InMemoryFileWriter } from '../CompilationContext';
import { DiagnosticBag } from '../../diagnostics/DiagnosticBag';

describe('CompilationContext Constructor TDD Specification', () => {
    test('1. Default constructor initializes default services cleanly', () => {
        expectTypeOf<typeof CompilationContext>().toBeConstructibleWith();
        const ctx = new CompilationContext();
        expect(ctx.diagnostics).toBeInstanceOf(DiagnosticBag);
        expect(ctx.fileWriter).toBeInstanceOf(InMemoryFileWriter);
        expect(ctx.watch).toBe(false);
        expect(ctx.strict).toBe(true);
        expect(ctx.targetBackend).toBe('typescript');
        expect(ctx.revision).toBe('1.0.0');
    });

    test('2. Constructor with custom parameters initializes immutably', () => {
        const customDiagnostics = DiagnosticBag.createEmpty();
        const customWriter = new InMemoryFileWriter();
        const ctx = new CompilationContext({
            diagnostics: customDiagnostics,
            fileWriter: customWriter,
            watch: true,
            strict: false,
            targetBackend: 'zod'
        });
        expect(ctx.diagnostics).toBe(customDiagnostics);
        expect(ctx.fileWriter).toBe(customWriter);
        expect(ctx.watch).toBe(true);
        expect(ctx.strict).toBe(false);
        expect(ctx.targetBackend).toBe('zod');
    });
});
```

---

## 4. Pass Manager & Graph Pipeline

### 4.1. `PassManager.ts`
**Lokasi Target**: `packages/core/src/compiler/passes/PassManager.ts`

```typescript
/**
 * PassManager.ts
 *
 * Orchestrates the DAG dependency scheduling and execution of compiler passes.
 * Structured constructor consuming PassGraph.
 *
 * @module compiler/passes
 */

import type { ExecutablePass } from './ExecutablePass';
import { PassGraph } from './PassGraph';
import { CompilationContext } from './CompilationContext';
import type { ArtifactKey } from '../artifacts/types';

export interface PassManagerDependencies {
    readonly passes?: readonly ExecutablePass[];
    readonly context?: CompilationContext;
}

export class PassManager {
    public readonly passes: readonly ExecutablePass[];
    public readonly context: CompilationContext;

    constructor({
        passes = Object.freeze([]),
        context = new CompilationContext()
    }: PassManagerDependencies = {}) {
        this.passes = Object.freeze(passes);
        this.context = context;
        Object.freeze(this);
    }

    public getExecutionOrder(externalInputs: readonly ArtifactKey[] = []): readonly ExecutablePass[] {
        return PassGraph.resolve(this.passes, externalInputs);
    }

    public getExecutionLayers(externalInputs: readonly ArtifactKey[] = []): readonly (readonly ExecutablePass[])[] {
        return PassGraph.resolveLayers(this.passes, externalInputs);
    }
}
```

### 4.2. TDD Test: `PassManager.spec.ts`
**Lokasi Test Vitest**: `packages/core/src/compiler/passes/__tests__/PassManager.spec.ts`

```typescript
import { describe, test, expect, expectTypeOf } from 'vitest';
import { PassManager } from '../PassManager';
import { CompilationContext } from '../CompilationContext';

describe('PassManager Constructor TDD Specification', () => {
    test('1. Default constructor initializes context and empty passes cleanly', () => {
        expectTypeOf<typeof PassManager>().toBeConstructibleWith();
        const manager = new PassManager();
        expect(manager.context).toBeInstanceOf(CompilationContext);
        expect(manager.passes).toHaveLength(0);
    });

    test('2. Constructor with custom instances injects dependencies immutably', () => {
        const customContext = new CompilationContext({ strict: false });
        const manager = new PassManager({
            context: customContext
        });
        expect(manager.context).toBe(customContext);
        expect(manager.context.strict).toBe(false);
    });
});
```
