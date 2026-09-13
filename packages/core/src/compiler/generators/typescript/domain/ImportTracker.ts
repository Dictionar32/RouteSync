/**
 * @file ImportTracker.ts
 * @description Sub-domain manager for import tracking and declaration synthesis
 *
 * @module compiler/generators/typescript/domain/ImportTracker
 */

import type { SemanticType } from '../../../types/SemanticType';
import { TSImportDeclaration } from '../../../target/typescript/nodes/TSImportDeclaration';
import { ImportCollector, type ImportSpec } from '../ImportCollector';

const PRIMITIVE_TYPE_NAMES = new Set([
    'string', 'number', 'boolean', 'null', 'undefined',
    'unknown', 'never', 'object', 'any', 'void'
]);

export class ImportTracker {
    public readonly collector: ImportCollector;

    constructor() {
        this.collector = new ImportCollector();
    }

    public reset(): void {
        this.collector.clear();
    }

    public getImports(): readonly ImportSpec[] {
        return this.collector.getImports();
    }

    public collectImportRequirement(typeName: string, generatedTypes: ReadonlySet<string>): void {
        if (PRIMITIVE_TYPE_NAMES.has(typeName)) return;
        if (generatedTypes.has(typeName)) return;
        if (this.collector.has(typeName, `./${typeName}`)) return;

        this.collector.addNamedImport(typeName, `./${typeName}`, true);
    }

    public collectPropertyTypeImports(type: SemanticType, generatedTypes: ReadonlySet<string>): void {
        switch (type.kind) {
            case 'reference':
                this.collectImportRequirement(type.name, generatedTypes);
                break;
            case 'readonly_collection':
            case 'mutable_collection':
                this.collectPropertyTypeImports(type.elementType, generatedTypes);
                break;
            case 'union':
            case 'intersection':
                for (const member of type.members.values()) {
                    this.collectPropertyTypeImports(member, generatedTypes);
                }
                break;
            case 'generic':
                this.collectImportRequirement(type.base.name, generatedTypes);
                for (const param of type.parameters) {
                    this.collectPropertyTypeImports(param.type, generatedTypes);
                }
                break;
            case 'object':
                for (const [, propType] of type.properties.entries()) {
                    this.collectPropertyTypeImports(propType, generatedTypes);
                }
                break;
            default:
                break;
        }
    }

    public buildImportDeclarations(): TSImportDeclaration[] {
        return this.collector.getImports().map(spec => this.convertImportSpecToDeclaration(spec));
    }

    private convertImportSpecToDeclaration(spec: ImportSpec): TSImportDeclaration {
        const namedImports = Array.from(spec.named);
        return spec.isTypeOnly
            ? TSImportDeclaration.typeImport(namedImports, spec.source)
            : TSImportDeclaration.valueImport(namedImports, spec.source);
    }
}
