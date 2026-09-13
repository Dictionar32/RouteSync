/**
 * @file ContractMetadataBuilder.ts
 * @description Sub-domain builder for shared types, enums, imports, and contract metadata
 *
 * @module core/ir/domain/ContractMetadataBuilder
 */

import type {
    SharedTypeIR,
    EnumIR,
    ImportIR,
    ContractMetadata,
    RouteManifest
} from '../../types/ir';

import { IR_VERSION, GENERATOR_VERSION } from './irTypes';

export class ContractMetadataBuilder {
    public buildSharedTypes(sharedTypes: Map<string, SharedTypeIR>): void {
        sharedTypes.set('Pagination', {
            name: 'Pagination',
            type: 'interface',
            definition: {
                fields: {
                    total: 'number',
                    perPage: 'number',
                    currentPage: 'number',
                    lastPage: 'number'
                }
            },
            usedBy: []
        });
    }

    public buildEnums(enums: Map<string, EnumIR>): void {
        // Reserved for extracting enums from TypeIR literal unions
    }

    public buildImports(useZod: boolean = true): ImportIR[] {
        const imports: ImportIR[] = [];

        if (useZod) {
            imports.push({
                module: 'zod',
                imports: [{ name: 'z' }],
                isTypeOnly: false
            });
        }

        return imports;
    }

    public buildMetadata(
        manifest: RouteManifest,
        totalResources: number,
        totalRequests: number,
        totalEndpoints: number
    ): ContractMetadata {
        return {
            version: IR_VERSION,
            generated_at: new Date().toISOString(),
            generator_version: GENERATOR_VERSION,
            source_files: manifest.metadata.source_files,
            total_resources: totalResources,
            total_requests: totalRequests,
            total_endpoints: totalEndpoints
        };
    }
}
