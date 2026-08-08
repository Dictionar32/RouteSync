/**
 * Response Field Parser
 * 
 * Parses a single response field from manifest into normalized structure.
 * 
 * Responsibility: Parse ONE field only
 * SOC: Only field parsing, no Zod generation
 * SOT: Source is manifest.routes[].response.fields[fieldName]
 */

/**
 * Raw response field data from manifest
 */
export interface ResponseFieldData {
    kind: 'primitive' | 'object' | 'array' | 'variable' | 'property_access';
    type?: string;
    fields?: Record<string, ResponseFieldData>;
    itemType?: ResponseFieldData;  // ✅ Fixed: was 'items'
    nullable?: boolean;  // ✅ Added explicit nullable flag
    optional?: boolean;  // ✅ Added explicit optional flag
    resolved?: {
        status: string;
        type?: string;
        model?: string;
        confidence?: number;
    };
}

/**
 * Parsed response field (normalized structure)
 */
export interface ParsedResponseField {
    name: string;
    kind: 'primitive' | 'object' | 'array';
    type: string;
    nullable: boolean;
    optional: boolean;
    fields?: ParsedResponseField[];  // For objects
    itemType?: ParsedResponseField;  // For arrays
}

/**
 * Parses single response field into normalized structure
 */
export class ResponseFieldParser {
    /**
     * Parse a single field from response
     * 
     * @param fieldName - Name of the field
     * @param fieldData - Raw field data from manifest
     * @returns Normalized parsed field
     */
    parseField(
        fieldName: string,
        fieldData: ResponseFieldData
    ): ParsedResponseField {
        const kind = this.normalizeKind(fieldData.kind);
        const type = this.extractType(fieldData);

        const parsed: ParsedResponseField = {
            name: fieldName,
            kind,
            type,
            nullable: this.isNullable(fieldData),
            optional: this.isOptional(fieldData),
        };

        // Handle nested fields for objects
        if (kind === 'object' && fieldData.fields) {
            parsed.fields = this.parseNestedFields(fieldData.fields);
        }

        // Handle array items
        if (kind === 'array' && fieldData.itemType) {
            parsed.itemType = this.parseField('item', fieldData.itemType);
        }

        return parsed;
    }

    /**
     * Normalize field kind to supported types
     */
    private normalizeKind(
        kind: string
    ): 'primitive' | 'object' | 'array' {
        switch (kind) {
            case 'primitive':
                return 'primitive';
            case 'object':
                return 'object';
            case 'array':
                return 'array';
            case 'variable':
            case 'property_access':
                // Variables and property access are treated as primitives
                // Their resolved type will determine actual type
                return 'primitive';
            default:
                // Default to primitive for unknown kinds
                return 'primitive';
        }
    }

    /**
     * Extract type from field data
     */
    private extractType(fieldData: ResponseFieldData): string {
        // Priority 1: Explicit type
        if (fieldData.type) {
            return this.normalizeType(fieldData.type);
        }

        // Priority 2: Resolved type
        if (fieldData.resolved?.type) {
            return this.normalizeType(fieldData.resolved.type);
        }

        // Priority 3: Resolved model
        if (fieldData.resolved?.model) {
            return fieldData.resolved.model;
        }

        // Priority 4: Infer from kind
        if (fieldData.kind === 'object') {
            return 'object';
        }

        if (fieldData.kind === 'array') {
            return 'array';
        }

        // Default: unknown
        return 'unknown';
    }

    /**
     * Normalize type to standard types
     */
    private normalizeType(type: string): string {
        const normalized = type.toLowerCase();

        // Map common type aliases
        const typeMap: Record<string, string> = {
            'int': 'number',
            'integer': 'number',
            'float': 'number',
            'double': 'number',
            'bool': 'boolean',
            'str': 'string',
        };

        return typeMap[normalized] || type;
    }

    /**
     * Check if field is nullable
     * 
     * A field is nullable if its resolved status indicates it can be null
     * or if it's explicitly marked as nullable
     */
    private isNullable(fieldData: ResponseFieldData): boolean {
        // Check explicit nullable flag
        if (fieldData.nullable === true) {
            return true;
        }

        // Check resolved status
        if (fieldData.resolved) {
            // If type includes null or is explicitly nullable
            if (fieldData.resolved.type?.includes('null')) {
                return true;
            }
        }

        // Default to false if not explicitly nullable
        return false;
    }

    /**
     * Check if field is optional
     * 
     * A field is optional if it may not be present in the response
     */
    private isOptional(fieldData: ResponseFieldData): boolean {
        // Check explicit optional flag
        if (fieldData.optional === true) {
            return true;
        }

        // Default to false if not explicitly optional
        return false;
    }

    /**
     * Parse nested fields recursively
     */
    private parseNestedFields(
        fields: Record<string, ResponseFieldData>
    ): ParsedResponseField[] {
        return Object.entries(fields).map(([name, data]) =>
            this.parseField(name, data)
        );
    }
}
