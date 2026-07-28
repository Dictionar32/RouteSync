/**
 * ContractGenerator.ts
 * 
 * UNIFIED GENERATOR - Contract IR Architecture
 * 
 * New architecture yang domain-centric:
 * 1. Build ContractIR dari RouteManifest (semua transformations done once)
 * 2. Run thin emitters yang consume ContractIR domains
 * 3. Each emitter hanya projection function
 * 
 * Benefits:
 * ✅ Separation of Concerns: IR building vs file emission
 * ✅ Emitter Simplicity: No more field transformations in emitters
 * ✅ Future Extensibility: New emitters tinggal consume existing IR
 * ✅ Testing Simplicity: Test IR building sekali, emitters deterministic
 */

import { RouteManifest } from '../../../core/src/types/route'
import { ContractIR, GeneratedFile, GeneratedOutput, GenerationContext, IREmitter, RouteManifest as IRRouteManifest, HttpMethod } from '../../../core/src/types/ir'
import { ContractIRBuilder } from '../../../core/src/ir/ContractIRBuilder'
import { SemanticResolution } from '../../../core/src/types/contract'
import { SemanticNode, SemanticType } from '../../../core/src/types/semantic'

// Import all emitters
import { ReadEmitter } from './layers/ReadEmitter'

import { FormEmitter } from './layers/FormEmitter'
import { SchemaEmitter } from './layers/SchemaEmitter'
import { ContractEmitter } from './layers/ContractEmitter'
import { FieldEmitter } from './layers/FieldEmitter'
import { MapperEmitter } from './layers/MapperEmitter'
import { SDKEmitter } from './layers/SDKEmitter'

export class ContractGenerator {
    private emitters = [
        new ReadEmitter(),
        new FormEmitter(),
        new SchemaEmitter(),
        new ContractEmitter(),
        new FieldEmitter(),
        new MapperEmitter(),
        new SDKEmitter()
    ]

    /**
     * Main entry point - Contract IR Architecture
     * 
     * Step 1: Build Contract IR dari manifest (ALL transformations done here)
     * Step 2: Validate IR integrity
     * Step 3: Generate files via thin emitters (pure projection functions)
     */
    async generate(manifest: RouteManifest): Promise<GeneratedOutput> {
        const startTime = performance.now()

        // Step 1: Build Contract IR dari manifest dengan mock context
        console.log('[ContractGenerator] Building Contract IR...')
        const mockContext: GenerationContext = {
            projectRoot: '.',
            outputDir: './output',
            config: {
                typescript: {
                    strict: true,
                    target: 'ES2020',
                    moduleResolution: 'node'
                },
                validation: {
                    useZod: true,
                    useLaravel: false
                },
                naming: {
                    caseTransform: 'camel',
                    resourceSuffix: 'Resource',
                    requestSuffix: 'Request'
                }
            },
            manifest: this.adaptManifest(manifest)
        }

        const contractIR = new ContractIRBuilder(mockContext).buildFromManifest(this.adaptManifest(manifest))

        const buildTime = performance.now() - startTime
        console.log(`[ContractGenerator] IR built in ${buildTime.toFixed(2)}ms`)
        console.log(`[ContractGenerator] IR contains:`)
        console.log(`  - Resources: ${contractIR.resources.length}`)
        console.log(`  - Requests: ${contractIR.requests.length}`)
        console.log(`  - Endpoints: ${contractIR.endpoints.length}`)

        // Step 2: Validate IR integrity
        this.validateIR(contractIR)

        // Step 3: Generate files via thin emitters
        console.log('[ContractGenerator] Running emitters...')
        const emitStartTime = performance.now()
        const allFiles: GeneratedFile[] = []

        for (const emitter of this.emitters) {
            try {
                const files = emitter.emit(contractIR)
                allFiles.push(...files)
                console.log(`[ContractGenerator] ${emitter.constructor.name}: ${files.length} files`)
            } catch (error) {
                console.error(`[ContractGenerator] Error in ${emitter.constructor.name}:`, error)
                // Continue with other emitters
            }
        }

        const emitTime = performance.now() - emitStartTime
        const totalTime = performance.now() - startTime

        console.log(`[ContractGenerator] Generated ${allFiles.length} files in ${totalTime.toFixed(2)}ms`)

        return {
            files: allFiles,
            ir: contractIR,
            metadata: {
                stats: {
                    resourceCount: contractIR.resources.length,
                    requestCount: contractIR.requests.length,
                    endpointCount: contractIR.endpoints.length,
                    fileCount: allFiles.length
                },
                performance: {
                    buildTime,
                    emitTime: emitTime
                }
            }
        }
    }

    /**
     * Validate IR integrity sebelum emission
     * 
     * Catch common issues early:
     * - Resource count
     * - Request count
     * - Basic structure integrity
     */
    private validateIR(ir: ContractIR): void {
        const errors: string[] = []

        // Basic validation
        if (!ir.resources || !Array.isArray(ir.resources)) {
            errors.push('Missing or invalid resources array')
        }

        if (!ir.requests || !Array.isArray(ir.requests)) {
            errors.push('Missing or invalid requests array')
        }

        if (!ir.endpoints || !Array.isArray(ir.endpoints)) {
            errors.push('Missing or invalid endpoints array')
        }

        // Check resource names are valid
        for (const resource of ir.resources || []) {
            if (!resource.name || typeof resource.name !== 'string') {
                errors.push(`Resource has invalid name: ${resource.name}`)
            }

            if (!resource.fields || !Array.isArray(resource.fields)) {
                errors.push(`Resource ${resource.name} has invalid fields`)
            }
        }

        // Check request structure
        for (const request of ir.requests || []) {
            if (!request.name || typeof request.name !== 'string') {
                errors.push(`Request has invalid name: ${request.name}`)
            }

            if (!request.actions || !Array.isArray(request.actions)) {
                errors.push(`Request ${request.name} has invalid actions`)
            }
        }

        if (errors.length > 0) {
            console.error('[ContractGenerator] IR Validation Errors:')
            errors.forEach(error => console.error(`  - ${error}`))
            throw new Error(`IR validation failed with ${errors.length} errors`)
        }

        console.log('[ContractGenerator] IR validation passed')
    }

    /**
     * Add custom emitter untuk future extensibility
     */
    addEmitter(emitter: ReadEmitter | ContractEmitter | SchemaEmitter | FieldEmitter | MapperEmitter | FormEmitter): void {
        this.emitters.push(emitter)
    }

    /**
     * Remove emitter by type
     */
    removeEmitter(emitterClass: new () => ReadEmitter | ContractEmitter | SchemaEmitter | FieldEmitter | MapperEmitter | FormEmitter): void {
        this.emitters = this.emitters.filter(e => !(e instanceof emitterClass))
    }

    /**
     * Debug helper - export IR untuk inspection
     */
    async debugExportIR(manifest: RouteManifest, outputPath?: string): Promise<ContractIR> {
        const mockContext: GenerationContext = {
            projectRoot: '.',
            outputDir: './output',
            config: {
                typescript: {
                    strict: true,
                    target: 'ES2020',
                    moduleResolution: 'node'
                },
                validation: {
                    useZod: true,
                    useLaravel: false
                },
                naming: {
                    caseTransform: 'camel',
                    resourceSuffix: 'Resource',
                    requestSuffix: 'Request'
                }
            },
            manifest: this.adaptManifest(manifest)
        }

        const debugIR = new ContractIRBuilder(mockContext).buildFromManifest(this.adaptManifest(manifest))

        if (outputPath) {
            const fs = await import('fs-extra')
            await fs.writeJson(outputPath, debugIR, { spaces: 2 })
            console.log(`[ContractGenerator] IR exported to ${outputPath}`)
        }

        return debugIR
    }

    /**
     * Helper function to validate and convert HTTP method string to HttpMethod type
     */
    private toHttpMethod(method: string): HttpMethod {
        const upperMethod = method.toUpperCase()
        const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

        if (validMethods.includes(upperMethod as HttpMethod)) {
            return upperMethod as HttpMethod
        }

        console.warn(`Invalid HTTP method: ${method}, defaulting to GET`)
        return 'GET'
    }

    /**
     * Helper function to safely convert SemanticResolution type string to SemanticType
     */
    private toSemanticType(typeString: string): SemanticType {
        const validTypes: SemanticType[] = [
            'string', 'number', 'boolean', 'datetime', 'array', 'object',
            'model', 'resource', 'collection', 'nullable', 'json-object',
            'json-member', 'BinaryFile', 'NewAccessToken', 'unknown'
        ]

        if (validTypes.includes(typeString as SemanticType)) {
            return typeString as SemanticType
        }

        // Fallback mapping for common cases
        if (typeString === 'int' || typeString === 'integer' || typeString === 'float' || typeString === 'double') {
            return 'number'
        }
        if (typeString === 'date' || typeString === 'timestamp') {
            return 'datetime'
        }
        if (typeString === 'bool') {
            return 'boolean'
        }

        console.warn(`Unknown semantic type: ${typeString}, defaulting to unknown`)
        return 'unknown'
    }

    /**
     * Helper function to convert SemanticResolution fields to SemanticType fields
     */
    private convertFieldsToSemanticType(fields?: Record<string, string>): Record<string, SemanticType> | undefined {
        if (!fields) return undefined

        const converted: Record<string, SemanticType> = {}
        for (const [key, value] of Object.entries(fields)) {
            converted[key] = this.toSemanticType(value)
        }
        return converted
    }

    /**
     * Helper function to safely convert SemanticResolution to SemanticNode
     */
    private toSemanticNode(resolution: SemanticResolution): SemanticNode {
        return {
            ...resolution,
            type: this.toSemanticType(resolution.type),
            fields: this.convertFieldsToSemanticType(resolution.fields)
        }
    }

    /**
     * Adapter to convert route.ts RouteManifest to ir.ts RouteManifest format
     * This bridges the two different manifest structures
     */
    private adaptManifest(manifest: RouteManifest): IRRouteManifest {
        return {
            resources: (manifest.resources || []).map(r => ({
                name: r.name,
                sourceModel: undefined,
                fields: Object.entries(r.fields || {}).map(([name, kind]) => ({
                    name,
                    resolved: kind.resolved ? this.toSemanticNode(kind.resolved) : undefined,
                    optional: false,
                    nullable: false,
                    readonly: false
                })),
                controller: undefined,
                routes: []
            })),
            requests: [], // Empty for now, will be built from routes
            routes: (manifest.routes || []).map(r => ({
                id: r.name || `${r.method}-${r.path}`,
                method: this.toHttpMethod(r.method),
                path: r.path,
                controller: r.controllerName || '',
                action: r.action || r.actionName || '',
                middleware: r.middleware
            })),
            metadata: {
                version: manifest.version || '1.0.0',
                scanned_at: manifest.generatedAt || new Date().toISOString(),
                source_files: []
            }
        }
    }
}

/**
 * Future emitter examples yang bisa ditambahkan:
 */

// OpenAPI/Swagger emitter
// export class OpenAPIEmitter implements IREmitter {
//   emit(ir: ContractIR): GeneratedFile[] {
//     return [{
//       path: 'openapi.json',
//       content: JSON.stringify(this.buildOpenAPISpec(ir), null, 2)
//     }]
//   }
// }

// SDK Generator untuk different languages
// export class KotlinSDKEmitter implements IREmitter {
//   emit(ir: ContractIR): GeneratedFile[] {
//     // Generate Kotlin data classes dari ResourceIR
//   }
// }

// React Query hooks emitter
// export class ReactQueryEmitter implements IREmitter {
//   emit(ir: ContractIR): GeneratedFile[] {
//     // Generate useQuery/useMutation hooks dari EndpointIR
//   }
// }