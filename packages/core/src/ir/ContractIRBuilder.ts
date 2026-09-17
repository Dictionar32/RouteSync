/**
 * @file ContractIRBuilder.ts
 * @description Active Consumer Orchestrator: transforms RouteManifest to ContractIR
 *
 * Consumes focused sub-domains from ./domain/ with pure dataflow declaration.
 * 0 inline parsing, 0 defensive fallback, 0 wildcard re-exports.
 *
 * @module core/ir/ContractIRBuilder
 */

import type {
    ContractIR,
    ResourceIR,
    RequestIR,
    EndpointIR,
    SharedTypeIR,
    EnumIR,
    RouteManifest,
    GenerationContext
} from '../types/ir';

import { DiagnosticCollector } from './domain/irTypes';
import { FieldTypeResolver } from './domain/FieldTypeResolver';
import { ResourceMapperBuilder } from './domain/ResourceMapperBuilder';
import { ResourceIRBuilder } from './domain/ResourceIRBuilder';
import { RequestEndpointBuilder } from './domain/RequestEndpointBuilder';
import { ContractMetadataBuilder } from './domain/ContractMetadataBuilder';

export class OptimizedContractIRBuilder {
    private readonly resources: Map<string, ResourceIR> = new Map();
    private readonly requests: Map<string, RequestIR> = new Map();
    private readonly endpoints: Map<string, EndpointIR> = new Map();
    private readonly sharedTypes: Map<string, SharedTypeIR> = new Map();
    private readonly enums: Map<string, EnumIR> = new Map();
    private readonly diagnostics: DiagnosticCollector = new DiagnosticCollector();

    private readonly fieldTypeResolver: FieldTypeResolver;
    private readonly mapperBuilder: ResourceMapperBuilder;
    private readonly resourceIRBuilder: ResourceIRBuilder;
    private readonly requestEndpointBuilder: RequestEndpointBuilder;
    private readonly metadataBuilder: ContractMetadataBuilder;

    constructor(private readonly context: GenerationContext = {
        projectRoot: '',
        outputDir: '',
        config: {
            typescript: { strict: true, target: 'es2020', moduleResolution: 'node' },
            validation: { useZod: true, useLaravel: false },
            naming: { caseTransform: 'camel', resourceSuffix: 'Resource', requestSuffix: 'Request' }
        },
        manifest: {
            routes: [],
            resources: [],
            requests: [],
            metadata: {
                version: '1.0.0',
                scanned_at: '1970-01-01T00:00:00.000Z',
                source_files: []
            }
        }
    }) {
        this.fieldTypeResolver = new FieldTypeResolver(this.diagnostics, context.config.naming.caseTransform);
        this.mapperBuilder = new ResourceMapperBuilder();
        this.resourceIRBuilder = new ResourceIRBuilder(this.fieldTypeResolver, this.mapperBuilder);
        this.requestEndpointBuilder = new RequestEndpointBuilder(this.fieldTypeResolver, this.mapperBuilder);
        this.metadataBuilder = new ContractMetadataBuilder();
    }

    /**
     * Ergonomic shortcut: builds Contract IR from parsed manifest
     */
    public build(manifest: RouteManifest): ContractIR {
        return this.buildFromManifest(manifest);
    }

    /**
     * Pure Flow Declaration:
     *   manifest -> buildResources -> buildRequests -> buildEndpoints -> buildMetadata -> ContractIR
     */
    public buildFromManifest(manifest: RouteManifest): ContractIR {
        this.diagnostics.info('Building Contract IR from manifest');

        for (const resource of manifest.resources) {
            const resourceIR = this.resourceIRBuilder.buildResourceIR(resource, this.resources);
            this.resources.set(resourceIR.name, resourceIR);
        }

        for (const request of manifest.requests) {
            const requestIR = this.requestEndpointBuilder.buildRequestIR(request);
            this.requests.set(requestIR.name, requestIR);
        }

        for (const route of manifest.routes) {
            const endpointIR = this.requestEndpointBuilder.buildEndpointIR(route, this.requests);
            this.endpoints.set(endpointIR.id, endpointIR);
        }

        this.metadataBuilder.buildSharedTypes(this.sharedTypes);
        this.metadataBuilder.buildEnums(this.enums);

        const ir: ContractIR = {
            resources: Array.from(this.resources.values()),
            requests: Array.from(this.requests.values()),
            endpoints: Array.from(this.endpoints.values()),
            sharedTypes: Array.from(this.sharedTypes.values()),
            enums: Array.from(this.enums.values()),
            imports: this.metadataBuilder.buildImports(this.context.config.validation.useZod),
            metadata: this.metadataBuilder.buildMetadata(
                manifest,
                this.resources.size,
                this.requests.size,
                this.endpoints.size
            )
        };

        this.diagnostics.info(
            `Built Contract IR: ${ir.resources.length} resources, ${ir.requests.length} requests, ${ir.endpoints.length} endpoints`
        );
        return ir;
    }

    /**
     * Validate IR integrity via RequestEndpointBuilder sub-domain
     */
    public validateIR(ir: ContractIR): void {
        this.requestEndpointBuilder.validateIR(ir, this.diagnostics);
    }

    /**
     * Get collected diagnostics for logging/debugging
     */
    public getDiagnostics(): ReturnType<DiagnosticCollector['getDiagnostics']> {
        return this.diagnostics.getDiagnostics();
    }
}

export { OptimizedContractIRBuilder as ContractIRBuilder };
