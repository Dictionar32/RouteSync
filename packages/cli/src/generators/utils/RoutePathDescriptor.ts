/**
 * RoutePathDescriptor.ts
 *
 * Domain Value Object for parsing and deriving canonical resource names from route paths.
 * Pure Structured Constructor (0 'if', 0 'null' returns, 0 ternary conditionals).
 *
 * @module cli/generators/utils
 */

import { toPascalCase, sanitizeResourceName } from '../../../../core/src/utils/resource-naming';

export interface RoutePathDescriptorParams {
    readonly path: string;
}

export class RoutePathDescriptor {
    public readonly segments: readonly string[];
    public readonly resourceName: string;

    constructor({ path }: RoutePathDescriptorParams) {
        const cleanedSegments = path
            .split('/')
            .filter(segment => segment.length > 0)
            .filter(segment => segment !== 'api')
            .filter(segment => !segment.startsWith('{'));

        this.segments = Object.freeze(cleanedSegments);
        this.resourceName = this.deriveResourceName(cleanedSegments);
        Object.freeze(this);
    }

    private deriveResourceName(segments: readonly string[]): string {
        const derivations: readonly (() => string)[] = [
            () => '',
            () => {
                const [firstSegment, ...restSegments] = segments;
                const head = sanitizeResourceName(firstSegment);
                const tail = restSegments.map(seg => toPascalCase(sanitizeResourceName(seg))).join('');
                return `${head}${tail}`;
            }
        ];

        return derivations[Number(segments.length > 0)]();
    }
}