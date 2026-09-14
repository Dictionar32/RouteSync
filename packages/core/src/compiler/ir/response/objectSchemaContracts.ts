/**
 * objectSchemaContracts.ts
 *
 * Level 7 Subatomic Closed ADT Contracts for ObjectSchema and PropertyType.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
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

export interface ObjectSchemaContract {
    readonly name: string;
    readonly propertyEntries: readonly (readonly [string, PropertyTypeContract])[];
    readonly requiredProperties: readonly string[];
    readonly additionalProperties: boolean;
}
