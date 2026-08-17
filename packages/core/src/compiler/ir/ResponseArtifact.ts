/**
 * ResponseArtifact: Pure Compiler IR for HTTP Response Analysis
 * 
 * PHILOSOPHY: Artifact represents ANALYSIS RESULTS ONLY, not generation decisions.
 * 
 * Separation of concerns:
 * - HOW response sent (ResponseDescriptor - HTTP transport)
 * - WHAT response contains (ResponseBody - discriminated union)
 * 
 * Design principles:
 * 1. Orthogonal: transport dan body completely independent
 * 2. Discriminated unions: TypeScript type safety
 * 3. Shape in body: collection = data property, bukan transport
 * 4. Immutable: all readonly for compiler pipeline
 * 5. Pure analysis: NO backend/generator concerns
 * 6. Deterministic: same input → same artifact (no timestamp!)
 * 7. Uses compiler artifact patterns (class extends TypedArtifact)
 * 
 * Compiler pipeline:
 * Frontend → Semantic Analysis → Artifact/IR → Backend
 * 
 * Backend queries artifact via registry, tidak tahu tentang PHP parser.
 */

import type { FileSpan } from '../types/FileSpan';
import type { ArtifactMetadata } from '../artifacts/Artifact';
import { TypedArtifact } from '../artifacts/Artifact';

// ============================================================================
// CONFIDENCE SCORING (With Transparency)
// ============================================================================

/**
 * Confidence score dengan reasons untuk transparency
 * 
 * WHY: Users perlu tahu KENAPA confidence rendah
 * 
 * @example
 * ```typescript
 * confidence: {
 *   score: 0.72,
 *   reasons: [
 *     "Variable-built JSON response",
 *     "Dynamic array mutation detected"
 *   ],
 *   method: 'heuristic'
 * }
 * ```
 */
export interface ConfidenceScore {
    /** Score 0.0-1.0 (1.0 = fully confident, 0.0 = pure guess) */
    readonly score: number;

    /** Human-readable reasons untuk score ini */
    readonly reasons: readonly string[];

    /** Inference method used */
    readonly method: 'explicit' | 'inferred' | 'heuristic' | 'fallback';
}

// ============================================================================
// RESPONSE DESCRIPTOR (Pure HTTP Transport)
// ============================================================================

/**
 * ResponseDescriptor: Pure HTTP transport metadata
 * 
 * HANYA describes bagaimana response dikirim via HTTP.
 * Shape TIDAK ada di sini (pindah ke body).
 */
export interface ResponseDescriptor {
    /**
     * Transport mechanism type
     */
    readonly transport:
    | "resource"    // Laravel Resource transformation
    | "model"       // Eloquent model mentah
    | "json"        // response()->json([...])
    | "primitive"   // return string/bool/int
    | "binary"      // file/download (unified!)
    | "stream"      // chunked transfer
    | "redirect"    // route redirect
    | "empty";      // no content

    /** HTTP status code */
    readonly status?: number;

    /** MIME type */
    readonly contentType?: string;

    /** Can return null/void */
    readonly nullable?: boolean;

    /**
     * Binary content disposition (UNIFIED!)
     * inline = view in browser, attachment = force download
     */
    readonly contentDisposition?: {
        readonly type: "inline" | "attachment";
        readonly filename?: string;
    };

    /** Redirect metadata */
    readonly redirect?: {
        readonly type: "route" | "url" | "back" | "action";
        readonly target?: string;
        readonly parameters?: Record<string, unknown>;
    };

    /** Stream metadata */
    readonly stream?: {
        readonly chunked: boolean;
        readonly callback?: string;
    };
}

// ============================================================================
// RESPONSE BODY (Discriminated Union)
// ============================================================================

/**
 * ResponseBody: Discriminated union dengan readonly type discriminator
 * 
 * Shape is HERE (in body), not in descriptor!
 * Collection adalah property dari DATA, bukan HTTP transport.
 */
export type ResponseBody =
    | ResourceBody
    | ModelBody
    | ObjectBody
    | PrimitiveBody;

/**
 * ResourceBody: Laravel Resource transformation
 */
export interface ResourceBody {
    readonly type: "resource";
    readonly resource: string;
    readonly model?: string;

    /** Shape is DATA property, not transport */
    readonly shape: "single" | "collection" | "paginated";

    readonly properties?: readonly PropertyDescriptor[];
}

/**
 * ModelBody: Eloquent model mentah
 */
export interface ModelBody {
    readonly type: "model";
    readonly model: string;

    /** Shape is DATA property */
    readonly shape: "single" | "collection" | "paginated";

    readonly attributes?: readonly ModelAttribute[];
}

/**
 * ObjectBody: Ad-hoc object structure
 */
export interface ObjectBody {
    readonly type: "object";
    readonly schemaName?: string;
    readonly schema: ObjectSchema;

    /** Shape is DATA property */
    readonly shape: "single" | "collection" | "paginated";
}

/**
 * PrimitiveBody: Scalar value
 */
export interface PrimitiveBody {
    readonly type: "primitive";
    readonly primitiveType: "string" | "number" | "boolean" | "null";

    /** Primitives always single */
    readonly shape: "single";
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface ObjectSchema {
    readonly name?: string;
    readonly properties: Record<string, PropertyType>;
    readonly required?: readonly string[];
    readonly additionalProperties?: boolean;
}

export interface PropertyType {
    readonly typeName: string;
    readonly nullable?: boolean;
    readonly isArray?: boolean;
    readonly schema?: ObjectSchema;
    readonly items?: PropertyType;
    readonly reference?: {
        readonly kind: "model" | "resource";
        readonly name: string;
    };
}

export interface PropertyDescriptor {
    readonly name: string;
    readonly type: PropertyType;
    readonly description?: string;
    readonly span?: FileSpan;
    readonly confidence?: number;
}

export interface ModelAttribute {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly default?: unknown;
    readonly comment?: string;
}

// ============================================================================
// RESPONSE ARTIFACT (Following Compiler Pattern)
// ============================================================================

/**
 * ResponseArtifact: Complete response analysis artifact
 * 
 * Following compiler artifact pattern (class extends TypedArtifact).
 * Uses base ArtifactMetadata (timestamp OK di sana, untuk compilation tracking).
 * 
 * PURE ANALYSIS RESULT:
 * - Contains ONLY semantic information extracted from source
 * - NO generation decisions (NO derivedNames!)
 * - NO backend concerns (naming, formatting, etc)
 * - Backend-agnostic (TypeScript, Kotlin, OpenAPI, etc)
 * 
 * @example
 * ```typescript
 * const artifact = new ResponseArtifact(
 *   'users.show.Response',
 *   { transport: 'resource', status: 200 },
 *   { type: 'resource', resource: 'UserResource', model: 'User', shape: 'single' },
 *   { score: 1.0, reasons: ['Explicit return type'], method: 'explicit' },
 *   sourceSpan,
 *   metadata
 * );
 * ```
 */
export class ResponseArtifact extends TypedArtifact<'ResponseArtifact'> {
    public readonly typeId = 'ResponseArtifact';

    constructor(
        /** Unique identifier (e.g., 'users.show.Response') */
        public readonly id: string,

        /** HOW response dikirim (pure HTTP transport) */
        public readonly descriptor: ResponseDescriptor,

        /** WHAT response berisi (optional: redirect/empty tidak punya body) */
        public readonly body: ResponseBody | undefined,

        /** Confidence tracking dengan transparency */
        public readonly confidence: ConfidenceScore,

        /** Precise source location (byte-level granularity) */
        public readonly span: FileSpan | undefined,

        /** Pure analysis metadata (from base Artifact) */
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isResourceBody(body: ResponseBody): body is ResourceBody {
    return body.type === 'resource';
}

export function isModelBody(body: ResponseBody): body is ModelBody {
    return body.type === 'model';
}

export function isObjectBody(body: ResponseBody): body is ObjectBody {
    return body.type === 'object';
}

export function isPrimitiveBody(body: ResponseBody): body is PrimitiveBody {
    return body.type === 'primitive';
}

export function isDataResponse(transport: ResponseDescriptor['transport']): boolean {
    return ['resource', 'model', 'json', 'primitive'].includes(transport);
}

export function isBinaryResponse(transport: ResponseDescriptor['transport']): boolean {
    return transport === 'binary';
}

export function isRedirectResponse(transport: ResponseDescriptor['transport']): boolean {
    return transport === 'redirect';
}

export function hasBody(artifact: ResponseArtifact): artifact is ResponseArtifact & { body: ResponseBody } {
    return artifact.body !== undefined;
}

export function isCollectionResponse(body: ResponseBody): boolean {
    if ('shape' in body) {
        return body.shape === 'collection' || body.shape === 'paginated';
    }
    return false;
}

export function isHighConfidence(artifact: ResponseArtifact): boolean {
    return artifact.confidence.score >= 0.8;
}

// ============================================================================
// BUILDER (Simplified - No Backend Concerns)
// ============================================================================

/**
 * Builder untuk ResponseArtifact
 * 
 * REMOVED:
 * - derivedNames computation (backend concern!)
 * - timestamp in hash (determinism!)
 * 
 * Builder now focuses ONLY on pure analysis data.
 */
export class ResponseArtifactBuilder {
    private _id: string = 'UnnamedResponse';
    private _descriptor: ResponseDescriptor = { transport: 'json' };
    private _body?: ResponseBody;
    private _confidence: ConfidenceScore = {
        score: 1.0,
        reasons: ['Default confidence'],
        method: 'explicit'
    };
    private _span?: FileSpan;
    private _metadataPartial: Partial<ArtifactMetadata> = {};

    id(value: string): this {
        this._id = value;
        return this;
    }

    transport(type: ResponseDescriptor['transport']): this {
        this._descriptor = { ...this._descriptor, transport: type };
        return this;
    }

    status(code: number): this {
        this._descriptor = { ...this._descriptor, status: code };
        return this;
    }

    contentType(type: string): this {
        this._descriptor = { ...this._descriptor, contentType: type };
        return this;
    }

    contentDisposition(type: 'inline' | 'attachment', filename?: string): this {
        this._descriptor = { ...this._descriptor, contentDisposition: { type, filename } };
        return this;
    }

    nullable(value = true): this {
        this._descriptor = { ...this._descriptor, nullable: value };
        return this;
    }

    /**
     * Set confidence score dengan transparency
     */
    confidence(score: ConfidenceScore): this {
        this._confidence = score;
        return this;
    }

    /**
     * Convenience method for simple confidence
     */
    confidenceScore(score: number, reason: string, method: ConfidenceScore['method'] = 'inferred'): this {
        this._confidence = {
            score: Math.max(0, Math.min(1, score)),
            reasons: [reason],
            method
        };
        return this;
    }

    body(body: ResponseBody): this {
        this._body = body;
        return this;
    }

    resource(
        resourceName: string,
        modelName: string | undefined,
        shape: ResourceBody['shape'] = 'single',
        confidenceScore = 1.0,
        confidenceReason = 'Explicit resource return'
    ): this {
        this._descriptor = { ...this._descriptor, transport: 'resource' };
        this._body = {
            type: 'resource',
            resource: resourceName,
            model: modelName,
            shape
        };
        this._confidence = {
            score: confidenceScore,
            reasons: [confidenceReason],
            method: 'explicit'
        };
        return this;
    }

    model(
        modelName: string,
        shape: ModelBody['shape'] = 'single',
        confidenceScore = 0.9,
        confidenceReason = 'Inferred from model return'
    ): this {
        this._descriptor = { ...this._descriptor, transport: 'model' };
        this._body = {
            type: 'model',
            model: modelName,
            shape
        };
        this._confidence = {
            score: confidenceScore,
            reasons: [confidenceReason],
            method: 'inferred'
        };
        return this;
    }

    primitive(
        primitiveType: PrimitiveBody['primitiveType'],
        confidenceScore = 1.0,
        confidenceReason = 'Explicit primitive return'
    ): this {
        this._descriptor = { ...this._descriptor, transport: 'primitive' };
        this._body = {
            type: 'primitive',
            primitiveType,
            shape: 'single'
        };
        this._confidence = {
            score: confidenceScore,
            reasons: [confidenceReason],
            method: 'explicit'
        };
        return this;
    }

    object(
        schemaName: string | undefined,
        schema: ObjectSchema,
        shape: ObjectBody['shape'] = 'single',
        confidenceScore = 0.8,
        confidenceReason = 'Heuristic object inference'
    ): this {
        this._descriptor = { ...this._descriptor, transport: 'json' };
        this._body = {
            type: 'object',
            schemaName,
            schema,
            shape
        };
        this._confidence = {
            score: confidenceScore,
            reasons: [confidenceReason],
            method: 'heuristic'
        };
        return this;
    }

    span(location: FileSpan): this {
        this._span = location;
        return this;
    }

    metadata(meta: Partial<ArtifactMetadata>): this {
        this._metadataPartial = { ...this._metadataPartial, ...meta };
        return this;
    }

    /**
     * DETERMINISTIC hash computation (NO timestamp!)
     * Content-based only.
     */
    private computeHash(): string {
        const content = JSON.stringify({
            id: this._id,
            descriptor: this._descriptor,
            body: this._body,
            confidence: this._confidence,
        });
        // Simple hash untuk demo (production: use crypto.createHash)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            hash = ((hash << 5) - hash) + content.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    build(): ResponseArtifact {
        const metadata: ArtifactMetadata = {
            hash: this.computeHash(),
            producer: this._metadataPartial.producer || 'ResponseAnalysisPass',
            dependencies: this._metadataPartial.dependencies || [],
            timestamp: this._metadataPartial.timestamp || Date.now(),
            revision: this._metadataPartial.revision || '1.0.0',
        };

        return new ResponseArtifact(
            this._id,
            this._descriptor,
            this._body,
            this._confidence,
            this._span,
            metadata
        );
    }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Resource single dengan compiler artifact pattern
 */
export function exampleResourceSingle(): ResponseArtifact {
    return new ResponseArtifactBuilder()
        .id('users.show.Response')
        .resource('UserResource', 'User', 'single', 1.0, 'Explicit UserResource return')
        .status(200)
        .contentType('application/json')
        .metadata({
            producer: 'ResponseAnalysisPass',
            dependencies: ['UserModel', 'UserResource'],
            revision: '1.0.0',
        })
        .build();
}

/**
 * Example 2: Collection dengan low confidence
 */
export function exampleCollectionLowConfidence(): ResponseArtifact {
    return new ResponseArtifactBuilder()
        .id('products.index.Response')
        .resource('ProductResource', 'Product', 'collection', 0.72, 'Variable-built collection')
        .status(200)
        .confidence({
            score: 0.72,
            reasons: [
                'Variable-built JSON response',
                'Dynamic array mutation detected',
                'Conditional resource wrapping'
            ],
            method: 'heuristic'
        })
        .metadata({
            producer: 'ResponseAnalysisPass',
            dependencies: ['ProductModel', 'ProductResource'],
            revision: '1.0.0',
        })
        .build();
}

/**
 * Example 3: Binary download
 */
export function exampleBinaryDownload(): ResponseArtifact {
    return new ResponseArtifactBuilder()
        .id('files.download.Response')
        .transport('binary')
        .contentType('application/pdf')
        .contentDisposition('attachment', 'document.pdf')
        .status(200)
        .confidence({
            score: 1.0,
            reasons: ['Explicit download() call'],
            method: 'explicit'
        })
        .metadata({
            producer: 'ResponseAnalysisPass',
            dependencies: [],
            revision: '1.0.0',
        })
        .build();
}

// ============================================================================
// ARTIFACT FAMILY (Pure IR Only - Remove Backend Concerns)
// ============================================================================

/**
 * ValidationArtifact: For FormRequest validation rules
 * PURE ANALYSIS: only validation rules, no generator logic
 */
export class ValidationArtifact extends TypedArtifact<'ValidationAnalysis'> {
    public readonly typeId = 'ValidationAnalysis';

    constructor(
        public readonly id: string,
        public readonly rules: Record<string, readonly string[]>,
        public readonly messages: Record<string, string> | undefined,
        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

/**
 * ModelArtifact: For Eloquent model metadata
 * PURE ANALYSIS: only model structure, no generator logic
 */
export class ModelArtifact extends TypedArtifact<'ModelAnalysis'> {
    public readonly typeId = 'ModelAnalysis';

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly table: string,
        public readonly attributes: readonly ModelAttribute[],
        public readonly relationships: readonly RelationshipDescriptor[] | undefined,
        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

/**
 * ResourceArtifact: For Laravel Resource metadata
 * PURE ANALYSIS: only resource structure, no generator logic
 */
export class ResourceArtifact extends TypedArtifact<'ResourceAnalysis'> {
    public readonly typeId = 'ResourceAnalysis';

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly model: string | undefined,
        public readonly properties: readonly PropertyDescriptor[],
        public readonly conditionalAttributes: readonly ConditionalAttribute[] | undefined,
        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

/**
 * RouteArtifact: Umbrella artifact combining all analysis
 * PURE ANALYSIS: route metadata only, no generator decisions
 */
export class RouteArtifact extends TypedArtifact<'RouteAnalysis'> {
    public readonly typeId = 'RouteAnalysis';

    constructor(
        public readonly id: string,
        public readonly method: string,
        public readonly path: string,
        public readonly controller: string,
        public readonly action: string,
        public readonly middleware: readonly string[] | undefined,
        public readonly parameters: readonly RouteParameter[] | undefined,

        /** Reference to ResponseArtifact by ID (not nested!) */
        public readonly responseRef: string | undefined,

        /** Reference to ValidationArtifact by ID */
        public readonly validationRef: string | undefined,

        public readonly span: FileSpan | undefined,
        public readonly metadata: ArtifactMetadata,
    ) {
        super();
    }
}

// Supporting types
interface RelationshipDescriptor {
    readonly type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
    readonly related: string;
    readonly foreignKey?: string;
}

interface ConditionalAttribute {
    readonly condition: string;
    readonly attributes: readonly string[];
}

interface RouteParameter {
    readonly name: string;
    readonly type: string;
    readonly optional: boolean;
}
