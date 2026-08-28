/**
 * FieldCollection.ts
 *
 * Shared generic field collection contract & operations for cross-flow usage.
 *
 * Used across compiler flows:
 *   - ApiField domain: FieldCollection<string>
 *   - Form domain: FieldCollection<FormField>
 *   - Mapper domain: FieldCollection<MapperField>
 *
 * @module compiler/domain/common
 */

/**
 * Shared generic field collection contract
 */
export interface FieldCollection<TField = string> {
    readonly fields: readonly TField[];
}

/**
 * Creates an immutable FieldCollection instance.
 *
 * @param fields - Array of fields
 * @returns Immutable FieldCollection<TField>
 */
export function createFieldCollection<TField>(
    fields: readonly TField[]
): FieldCollection<TField> {
    return { fields: [...fields] };
}

/**
 * Transforms a FieldCollection of type TSource into a FieldCollection of type TTarget.
 * Enables cross-flow pipeline stage transformations.
 *
 * @param collection - Input FieldCollection<TSource>
 * @param transformFn - Mapping function for each field element
 * @returns Transformed FieldCollection<TTarget>
 */
export function mapFieldCollection<TSource, TTarget>(
    collection: FieldCollection<TSource>,
    transformFn: (item: TSource, index: number) => TTarget
): FieldCollection<TTarget> {
    const transformedFields = collection.fields.map(transformFn);
    return { fields: transformedFields };
}
