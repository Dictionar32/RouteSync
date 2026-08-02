/**
 * ResponseArtifact: Compiler IR for HTTP Response Analysis
 * 
 * Memisahkan concern antara:
 * - HOW response dikirim (ResponseDescriptor - transport layer)
 * - WHAT response berisi (ResponseBody - content layer)
 * 
 * Design principles:
 * 1. Orthogonal: transport dan body independent
 * 2. Extensible: body schema bisa berkembang tanpa affect descriptor
 * 3. Type-safe: compiler IR dengan proper type definitions
 */

// ============================================================================
// Core Response Artifact
// ============================================================================

/**
 * Complete response artifact dari compiler analysis
 */
export interface ResponseArtifact {
    /**
     * HOW response dikirim (transport layer)
     */
    descriptor: ResponseDescriptor;

    /**
     * WHAT response berisi (content layer)
     * Optional karena beberapa transport tidak punya body (redirect, empty)
     */
    body?: ResponseBody;

    /**
     * Source location dalam controller method
     */
    source?: SourceLocation;
}

// ============================================================================
// Response Descriptor (Transport Layer)
// ============================================================================

/**
 * ResponseDescriptor: Metadata tentang bagaimana response dikirim
 * 
 * Fokus: HTTP transport mechanism, bukan isi response
 */
export interface ResponseDescriptor {
    /**
     * Transport mechanism
     */
    transport:
    | "resource"    // new XResource(...), XResource::make(...), XResource::collection(...)
    | "model"       // return Eloquent model/collection mentah, tanpa Resource wrapper
    | "json"        // response()->json([...]) — array/object literal ad-hoc
    | "primitive"   // return string/bool/int polos
    | "binary"      // response()->file(...), response()->download(...), file downloads
    | "stream"      // response()->stream(...), chunked transfer
    | "redirect"    // redirect()->route(...), redirect()->back(), dll
    | "empty";      // response()->noContent(), return void

    /**
     * Response shape (applicable untuk data responses)
     */
    shape: "single" | "collection" | "paginated";

    /**
     * HTTP status code (optional, default 200 untuk success)
     */
    status?: number;

    /**
     * Content-Type header
     */
    contentType?:
    | "application/json"
    | "text/plain"
    | "text/html"
    | "application/pdf"
    | "application/octet-stream"
    | string;

    /**
     * Content-Disposition header (untuk binary responses)
     * 
     * - "inline": tampilkan di browser (response()->file())
     * - "attachment": download dengan filename (response()->download())
     */
    contentDisposition?: {
        type: "inline" | "attachment";
        filename?: string;
    };

    /**
     * Response bisa null/undefined?
     */
    nullable?: boolean;

    /**
     * Redirect metadata (jika transport === "redirect")
     */
    redirect?: {
        type: "route" | "url" | "back" | "action";
        target?: string; // route name, URL, atau action name
        parameters?: Record<string, unknown>;
    };

    /**
     * Stream metadata (jika transport === "stream")
     */
    stream?: {
        chunked: boolean;
        callback?: string; // callback function name
    };
}

// ============================================================================
// Response Body (Content Layer)
// ============================================================================

/**
 * ResponseBody: Representasi isi response
 * 
 * Fokus: struktur data yang dikembalikan, bukan cara pengirimannya
 */
export interface ResponseBody {
    /**
     * Jenis body content
     */
    kind:
    | "resource"   // Laravel Resource transformation
    | "model"      // Eloquent model raw attributes
    | "object"     // Ad-hoc object/array structure
    | "primitive"; // Scalar value (string, number, boolean)

    /**
     * Schema struktur object (jika kind === "object")
     */
    schema?: ObjectSchema;

    /**
     * Resource class name (jika kind === "resource")
     */
    resource?: string;

    /**
     * Eloquent model name (jika kind === "model" atau resource wraps model)
     */
    model?: string;

    /**
     * Primitive type (jika kind === "primitive")
     */
    primitiveType?: "string" | "number" | "boolean" | "null";

    /**
     * Nested properties (untuk object/resource analysis)
     */
    properties?: PropertyDescriptor[];
}

/**
 * Object schema untuk ad-hoc structures
 * 
 * Example:
 * return response()->json([
 *     "user" => $user,
 *     "token" => $token
 * ]);
 * 
 * Schema:
 * {
 *     properties: {
 *         user: { type: "User", kind: "model" },
 *         token: { type: "string", kind: "primitive" }
 *     }
 * }
 */
export interface ObjectSchema {
    /**
     * Object properties dengan types
     */
    properties: Record<string, PropertyType>;

    /**
     * Required property keys
     */
    required?: string[];

    /**
     * Allow additional properties?
     */
    additionalProperties?: boolean;
}

/**
 * Property type descriptor
 */
export interface PropertyType {
    kind: "primitive" | "model" | "resource" | "object" | "array";
    type: string; // TypeScript type name
    nullable?: boolean;
    collection?: boolean;

    /**
     * Nested schema (jika kind === "object")
     */
    schema?: ObjectSchema;

    /**
     * Array item type (jika kind === "array")
     */
    items?: PropertyType;
}

/**
 * Property descriptor dengan metadata
 */
export interface PropertyDescriptor {
    name: string;
    type: PropertyType;
    description?: string;
    source?: SourceLocation;
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * Source location dalam PHP code
 */
export interface SourceLocation {
    file: string;
    line: number;
    column: number;
    length?: number;
}

// ============================================================================
// Type Guards
// ============================================================================

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

// ============================================================================
// Builder Helpers
// ============================================================================

/**
 * Builder untuk ResponseArtifact dengan sensible defaults
 */
export class ResponseArtifactBuilder {
    private artifact: ResponseArtifact = {
        descriptor: {
            transport: 'json',
            shape: 'single',
        }
    };

    transport(type: ResponseDescriptor['transport']): this {
        this.artifact.descriptor.transport = type;
        return this;
    }

    shape(shape: ResponseDescriptor['shape']): this {
        this.artifact.descriptor.shape = shape;
        return this;
    }

    status(code: number): this {
        this.artifact.descriptor.status = code;
        return this;
    }

    contentType(type: string): this {
        this.artifact.descriptor.contentType = type;
        return this;
    }

    contentDisposition(type: 'inline' | 'attachment', filename?: string): this {
        this.artifact.descriptor.contentDisposition = { type, filename };
        return this;
    }

    nullable(value = true): this {
        this.artifact.descriptor.nullable = value;
        return this;
    }

    body(body: ResponseBody): this {
        this.artifact.body = body;
        return this;
    }

    resource(resourceName: string, modelName?: string): this {
        this.artifact.body = {
            kind: 'resource',
            resource: resourceName,
            model: modelName
        };
        return this;
    }

    model(modelName: string): this {
        this.artifact.body = {
            kind: 'model',
            model: modelName
        };
        return this;
    }

    primitive(type: 'string' | 'number' | 'boolean' | 'null'): this {
        this.artifact.body = {
            kind: 'primitive',
            primitiveType: type
        };
        return this;
    }

    object(schema: ObjectSchema): this {
        this.artifact.body = {
            kind: 'object',
            schema
        };
        return this;
    }

    source(location: SourceLocation): this {
        this.artifact.source = location;
        return this;
    }

    build(): ResponseArtifact {
        return this.artifact;
    }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Resource response
 * 
 * return new UserResource($user);
 */
export const exampleResourceResponse: ResponseArtifact = {
    descriptor: {
        transport: 'resource',
        shape: 'single',
        status: 200,
        contentType: 'application/json'
    },
    body: {
        kind: 'resource',
        resource: 'UserResource',
        model: 'User'
    }
};

/**
 * Example 2: Collection response dengan pagination
 * 
 * return UserResource::collection(User::paginate());
 */
export const exampleCollectionResponse: ResponseArtifact = {
    descriptor: {
        transport: 'resource',
        shape: 'paginated',
        status: 200,
        contentType: 'application/json'
    },
    body: {
        kind: 'resource',
        resource: 'UserResource',
        model: 'User'
    }
};

/**
 * Example 3: Ad-hoc JSON response
 * 
 * return response()->json([
 *     "user" => $user,
 *     "token" => $token,
 *     "expires_in" => 3600
 * ]);
 */
export const exampleAdHocResponse: ResponseArtifact = {
    descriptor: {
        transport: 'json',
        shape: 'single',
        status: 200,
        contentType: 'application/json'
    },
    body: {
        kind: 'object',
        schema: {
            properties: {
                user: {
                    kind: 'model',
                    type: 'User',
                    nullable: false
                },
                token: {
                    kind: 'primitive',
                    type: 'string',
                    nullable: false
                },
                expires_in: {
                    kind: 'primitive',
                    type: 'number',
                    nullable: false
                }
            },
            required: ['user', 'token', 'expires_in']
        }
    }
};

/**
 * Example 4: File download
 * 
 * return response()->download($pathToFile);
 */
export const exampleDownloadResponse: ResponseArtifact = {
    descriptor: {
        transport: 'binary',
        shape: 'single',
        status: 200,
        contentType: 'application/octet-stream',
        contentDisposition: {
            type: 'attachment',
            filename: 'report.pdf'
        }
    }
    // No body - binary stream
};

/**
 * Example 5: Inline file display
 * 
 * return response()->file($pathToFile);
 */
export const exampleFileResponse: ResponseArtifact = {
    descriptor: {
        transport: 'binary',
        shape: 'single',
        status: 200,
        contentType: 'application/pdf',
        contentDisposition: {
            type: 'inline'
        }
    }
};

/**
 * Example 6: Redirect response
 * 
 * return redirect()->route('dashboard');
 */
export const exampleRedirectResponse: ResponseArtifact = {
    descriptor: {
        transport: 'redirect',
        shape: 'single',
        status: 302,
        redirect: {
            type: 'route',
            target: 'dashboard'
        }
    }
};

/**
 * Example 7: Empty response
 * 
 * return response()->noContent();
 */
export const exampleEmptyResponse: ResponseArtifact = {
    descriptor: {
        transport: 'empty',
        shape: 'single',
        status: 204
    }
};

/**
 * Example 8: Primitive response
 * 
 * return "OK";
 */
export const examplePrimitiveResponse: ResponseArtifact = {
    descriptor: {
        transport: 'primitive',
        shape: 'single',
        status: 200,
        contentType: 'text/plain'
    },
    body: {
        kind: 'primitive',
        primitiveType: 'string'
    }
};

/**
 * Example 9: Nullable response
 * 
 * return $user ? new UserResource($user) : null;
 */
export const exampleNullableResponse: ResponseArtifact = {
    descriptor: {
        transport: 'resource',
        shape: 'single',
        status: 200,
        contentType: 'application/json',
        nullable: true
    },
    body: {
        kind: 'resource',
        resource: 'UserResource',
        model: 'User'
    }
};

/**
 * Example 10: Stream response
 * 
 * return response()->stream($callback);
 */
export const exampleStreamResponse: ResponseArtifact = {
    descriptor: {
        transport: 'stream',
        shape: 'single',
        status: 200,
        contentType: 'text/event-stream',
        stream: {
            chunked: true,
            callback: 'streamCallback'
        }
    }
};
