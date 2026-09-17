/**
 * Model column boundary.
 *
 * Database schema facts must come from the Laravel migration AST. Model
 * conventions such as `id`, `*_id`, and timestamps are not schema evidence.
 */

import type { ParsedColumn } from '../../../../types/route';

export function resolveModelColumns(
    table: string,
    migrationMap: ReadonlyMap<string, readonly ParsedColumn[]>
): readonly ParsedColumn[] {
    const columns = migrationMap.get(table);
    if (columns === undefined) {
        throw new Error(
            `Model boundary violation: migration schema for table "${table}" was not found. ` +
            'Model columns cannot be synthesized from Eloquent naming conventions.'
        );
    }

    return Object.freeze([...columns]);
}
