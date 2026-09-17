/**
 * objectSchemaContracts.ts
 *
 * Closed response-schema contracts.
 * Property order is canonical and represented as an array.
 *
 * @module compiler/ir/response
 */

export interface ScalarPropertyContract {
    readonly kind: 'scalar';
    readonly typeName: string;
    readonly nullable: boolean;
}

export interface ArrayPropertyContract {
    readonly kind: 'array';
    readonly item: PropertyTypeContract;
}

export interface NestedObjectPropertyContract {
    readonly kind: 'object';
    readonly schema: ObjectSchemaContract;
}

export interface ReferencePropertyContract {
    readonly kind: 'reference';
    readonly refKind: 'model' | 'resource';
    readonly name: string;
}

export type PropertyTypeContract =
    | ScalarPropertyContract
    | ArrayPropertyContract
    | NestedObjectPropertyContract
    | ReferencePropertyContract;

export interface ObjectSchemaPropertyContract {
    readonly name: string;
    readonly type: PropertyTypeContract;
    readonly required: boolean;
}

export interface ObjectSchemaContract {
    readonly name: string;
    readonly properties: readonly ObjectSchemaPropertyContract[];
    readonly additionalProperties: boolean;
}
