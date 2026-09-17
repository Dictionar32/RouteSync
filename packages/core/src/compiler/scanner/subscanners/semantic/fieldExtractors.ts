/**
 * Resource semantic field boundary.
 *
 * Fields reaching this module are already verified by the scanner.
 * No unknown-shape probing, type-string inference, or primitive fallback.
 */
import type { ParsedResource } from '../../../../types/route';
import type { ResourceFieldDescriptor } from '../../../../types/domain/expressions';

export function normalizeResourceFields(
    resource: ParsedResource
): readonly ResourceFieldDescriptor[] {
    return resource.fields;
}
