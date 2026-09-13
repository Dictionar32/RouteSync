/**
 * responseBodies.ts
 *
 * Discriminated union and type guards for HTTP response bodies.
 * Shape is a property of data, not HTTP transport.
 *
 * @module compiler/ir/response
 */

import type { PropertyDescriptor, ModelAttribute, ObjectSchema } from './objectSchemas';

/**
 * ResponseBody: Discriminated union with readonly type discriminator
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
    readonly type: 'resource';
    readonly resource: string;
    readonly model?: string;

    /** Shape is DATA property, not transport */
    readonly shape: 'single' | 'collection' | 'paginated';

    readonly properties?: readonly PropertyDescriptor[];
}

/**
 * ModelBody: Eloquent model structure
 */
export interface ModelBody {
    readonly type: 'model';
    readonly model: string;

    /** Shape is DATA property */
    readonly shape: 'single' | 'collection' | 'paginated';

    readonly attributes?: readonly ModelAttribute[];
}

/**
 * ObjectBody: Ad-hoc object structure
 */
export interface ObjectBody {
    readonly type: 'object';
    readonly schemaName?: string;
    readonly schema: ObjectSchema;

    /** Shape is DATA property */
    readonly shape: 'single' | 'collection' | 'paginated';
}

/**
 * PrimitiveBody: Scalar value
 */
export interface PrimitiveBody {
    readonly type: 'primitive';
    readonly primitiveType: 'string' | 'number' | 'boolean' | 'null' | 'void';

    /** Primitives always single */
    readonly shape: 'single';
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

export function isCollectionResponse(body: ResponseBody): boolean {
    if ('shape' in body) {
        return body.shape === 'collection' || body.shape === 'paginated';
    }
    return false;
}
