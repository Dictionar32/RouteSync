/**
 * Example: Using Contract IR Architecture
 * 
 * This example demonstrates:
 * 1. Building ContractIR from RouteManifest
 * 2. Creating custom emitters  
 * 3. Generating files with unified generator
 * 4. Extending with new output formats
 */

import { ContractIRBuilder } from '../packages/core/src/ir/ContractIRBuilder'
import { ContractGenerator } from '../packages/cli/src/generators/ContractGenerator'
import type { RouteManifest } from '../packages/core/src/types/route'
import type { ContractIR, IREmitter, GeneratedFile } from '../packages/core/src/types/ir'

// =============================================================================
// 1. SAMPLE MANIFEST (from Laravel project)
// =============================================================================

const sampleManifest: RouteManifest = {
    version: '1.0.0',
    baseURL: 'https://api.example.com',
    generatedAt: '2024-01-01T00:00:00Z',
    routes: [
        {
            name: 'orders.index',
            method: 'GET',
            path: '/api/orders',
            auth: false,
            middleware: [],
            response: {
                kind: 'resource',
                resource: 'OrderResource',
                collection: true,
                paginated: true
            }
        },
        {
            name: 'orders.show',
            method: 'GET',
            path: '/api/orders/{id}',
            auth: true,
            middleware: ['auth'],
            response: {
                kind: 'resource',
                resource: 'OrderResource',
                collection: false
            }
        },
        {
            name: 'orders.store',
            method: 'POST',
            path: '/api/orders',
            auth: true,
            middleware: ['auth'],
            schema: {
                rules: {
                    'customer_name': 'required|string|max:255',
                    'product_items': 'required|array',
                    'total_minor': 'required|integer|min:0'
                }
            }
        }
    ],
    resources: [
        {
            name: 'OrderResource',
            fields: {
                'id': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number' }
                },
                'customer_name': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string' }
                },
                'total_minor': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number' }
                },
                'product_items': {
                    kind: 'resource',
                    resource: 'ProductItemResource',
                    collection: true,
                    resolved: { type: 'resource', resource: 'ProductItemResource', collection: true }
                },
                'created_at': {
                    kind: 'primitive',
                    type: 'datetime',
                    resolved: { type: 'string' }
                },
                'updated_at': {
                    kind: 'primitive',
                    type: 'datetime',
                    resolved: { type: 'string' }
                }
            }
        },
        {
            name: 'ProductItemResource',
            fields: {
                'id': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number' }
                },
                'product_name': {
                    kind: 'primitive',
                    type: 'string',
                    resolved: { type: 'string' }
                },
                'unit_price_minor': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number' }
                },
                'quantity': {
                    kind: 'primitive',
                    type: 'int',
                    resolved: { type: 'number' }
                }
            }
        }
    ],
    models: [
        {
            name: 'Order',
            table: 'orders',
            columns: [
                { name: 'id', type: 'bigint', nullable: false },
                { name: 'customer_name', type: 'varchar', nullable: false },
                { name: 'total_minor', type: 'int', nullable: false },
                { name: 'created_at', type: 'timestamp', nullable: false },
                { name: 'updated_at', type: 'timestamp', nullable: false }
            ]
        },
        {
            name: 'ProductItem',
            table: 'product_items',
            columns: [
                { name: 'id', type: 'bigint', nullable: false },
                { name: 'product_name', type: 'varchar', nullable: false },
                { name: 'unit_price_minor', type: 'int', nullable: false },
                { name: 'quantity', type: 'int', nullable: false }
            ]
        }
    ]
}

// =============================================================================
// 2. BUILDING CONTRACT IR
// =============================================================================

async function demonstrateIRBuilding() {
    console.log('🏗️ Building Contract IR from RouteManifest...\n')

    const builder = new ContractIRBuilder()
    const ir = builder.buildFromManifest(sampleManifest)

    // Inspect the built IR
    console.log('📊 Contract IR Structure:')
    console.log(`  Resources: ${ir.resources.length}`)
    console.log(`  Requests: ${ir.requests.length}`)
    console.log(`  Endpoints: ${ir.endpoints.length}`)
    console.log(`  Base URL: ${ir.metadata.baseURL}`)
    console.log('')

    // Inspect field transformations
    const orderResource = ir.resources.find(r => r.name === 'OrderResource')
    if (orderResource) {
        console.log('🔄 Field Transformations (OrderResource):')
        orderResource.fields.forEach(field => {
            console.log(`  ${field.name} → ${field.transformedName} (${field.semanticType.kind})`)
        })
        console.log('')

        console.log('🏷️ Generated Aliases:')
        orderResource.aliases.forEach(alias => {
            const arraySuffix = alias.isArray ? '[]' : ''
            console.log(`  ${alias.name} = ${alias.target}${arraySuffix}`)
        })
        console.log('')

        console.log('🎭 Resource Variants:')
        orderResource.variants.forEach(variant => {
            console.log(`  ${variant.kind}: ${variant.metadata.purpose}`)
        })
        console.log('')
    }

    return ir
}

// =============================================================================
// 3. CUSTOM EMITTER EXAMPLES
// =============================================================================

// Example: GraphQL Schema Emitter
class GraphQLEmitter implements IREmitter {
    emit(ir: ContractIR): GeneratedFile[] {
        const lines: string[] = []

        lines.push('# Generated GraphQL Schema from Contract IR')
        lines.push('')

        // Generate GraphQL types from ResourceIR
        for (const resource of ir.resources) {
            lines.push(this.generateGraphQLType(resource))
            lines.push('')
        }

        // Generate GraphQL queries from EndpointIR
        lines.push('type Query {')
        for (const endpoint of ir.endpoints) {
            if (endpoint.method === 'GET') {
                lines.push(this.generateGraphQLQuery(endpoint, ir))
            }
        }
        lines.push('}')
        lines.push('')

        // Generate GraphQL mutations
        lines.push('type Mutation {')
        for (const endpoint of ir.endpoints) {
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(endpoint.method)) {
                lines.push(this.generateGraphQLMutation(endpoint, ir))
            }
        }
        lines.push('}')

        return [{
            path: 'schema.graphql',
            content: lines.join('\n'),
            metadata: {
                emitter: 'GraphQLEmitter',
                generatedAt: new Date().toISOString(),
                dependencies: []
            }
        }]
    }

    private generateGraphQLType(resource: any): string {
        const lines: string[] = []
        lines.push(`type ${resource.name.replace('Resource', '')} {`)

        for (const field of resource.fields) {
            const graphqlType = this.mapSemanticTypeToGraphQL(field.semanticType)
            const nullable = field.nullable ? '' : '!'
            lines.push(`  ${field.transformedName}: ${graphqlType}${nullable}`)
        }

        lines.push('}')
        return lines.join('\n')
    }

    private generateGraphQLQuery(endpoint: any, ir: ContractIR): string {
        const operationName = this.getOperationName(endpoint)
        const returnType = this.getGraphQLReturnType(endpoint, ir)
        const args = this.getGraphQLArgs(endpoint)

        return `  ${operationName}${args}: ${returnType}`
    }

    private generateGraphQLMutation(endpoint: any, ir: ContractIR): string {
        const operationName = this.getOperationName(endpoint)
        const returnType = this.getGraphQLReturnType(endpoint, ir)
        const args = this.getGraphQLArgs(endpoint)

        return `  ${operationName}${args}: ${returnType}`
    }

    private mapSemanticTypeToGraphQL(semanticType: any): string {
        switch (semanticType.kind) {
            case 'primitive':
                switch (semanticType.type) {
                    case 'string': return 'String'
                    case 'number': return 'Int'
                    case 'boolean': return 'Boolean'
                    case 'date': return 'String' // ISO date
                    default: return 'String'
                }
            case 'resource':
                const base = semanticType.resource.replace('Resource', '')
                return semanticType.collection ? `[${base}]` : base
            default:
                return 'String'
        }
    }

    private getOperationName(endpoint: any): string {
        const pathParts = endpoint.path.split('/').filter(Boolean)
        const resource = pathParts[1] || 'unknown' // Skip 'api'
        const hasId = endpoint.pathParams.some((p: any) => p.name === 'id')

        switch (endpoint.method) {
            case 'GET': return hasId ? `get${resource}` : `list${resource}`
            case 'POST': return `create${resource.slice(0, -1)}` // Remove 's'
            case 'PUT':
            case 'PATCH': return `update${resource.slice(0, -1)}`
            case 'DELETE': return `delete${resource.slice(0, -1)}`
            default: return `${endpoint.method.toLowerCase()}${resource}`
        }
    }

    private getGraphQLReturnType(endpoint: any, ir: ContractIR): string {
        if (endpoint.response.resource) {
            const resourceName = endpoint.response.resource.replace('Resource', '')
            switch (endpoint.response.type) {
                case 'collection': return `[${resourceName}]`
                case 'paginated': return `${resourceName}Connection`
                default: return resourceName
            }
        }
        return 'String'
    }

    private getGraphQLArgs(endpoint: any): string {
        const args: string[] = []

        // Path parameters
        for (const param of endpoint.pathParams) {
            args.push(`${param.name}: ID!`)
        }

        // Query parameters  
        for (const param of endpoint.queryParams) {
            const graphqlType = this.mapSemanticTypeToGraphQL(param.type)
            const required = param.required ? '!' : ''
            args.push(`${param.name}: ${graphqlType}${required}`)
        }

        return args.length > 0 ? `(${args.join(', ')})` : ''
    }
}

// Example: Documentation Emitter
class DocumentationEmitter implements IREmitter {
    emit(ir: ContractIR): GeneratedFile[] {
        const lines: string[] = []

        lines.push('# API Documentation')
        lines.push('')
        lines.push('Generated from Contract IR - RouteSync')
        lines.push('')

        // Document resources
        lines.push('## Resources')
        lines.push('')
        for (const resource of ir.resources) {
            lines.push(`### ${resource.name}`)
            lines.push('')

            if (resource.sourceModel) {
                lines.push(`**Source Model:** ${resource.sourceModel}`)
                lines.push('')
            }

            lines.push('**Fields:**')
            lines.push('')
            lines.push('| Field | Type | Optional | Nullable | Description |')
            lines.push('|-------|------|----------|----------|-------------|')

            for (const field of resource.fields) {
                const type = this.formatSemanticType(field.semanticType)
                const optional = field.optional ? '✓' : '-'
                const nullable = field.nullable ? '✓' : '-'
                const description = field.description || '-'
                lines.push(`| ${field.transformedName} | ${type} | ${optional} | ${nullable} | ${description} |`)
            }
            lines.push('')
        }

        // Document endpoints
        lines.push('## Endpoints')
        lines.push('')
        for (const endpoint of ir.endpoints) {
            const title = `${endpoint.method} ${endpoint.path}`
            lines.push(`### ${title}`)
            lines.push('')

            lines.push(`**Authentication:** ${endpoint.metadata.auth ? 'Required' : 'None'}`)
            lines.push('')

            if (endpoint.pathParams.length > 0) {
                lines.push('**Path Parameters:**')
                lines.push('')
                for (const param of endpoint.pathParams) {
                    lines.push(`- \`${param.name}\`: ${this.formatSemanticType(param.type)}`)
                }
                lines.push('')
            }

            if (endpoint.queryParams.length > 0) {
                lines.push('**Query Parameters:**')
                lines.push('')
                for (const param of endpoint.queryParams) {
                    const required = param.required ? ' (required)' : ' (optional)'
                    lines.push(`- \`${param.name}\`: ${this.formatSemanticType(param.type)}${required}`)
                }
                lines.push('')
            }

            lines.push('**Response:**')
            lines.push('')
            const responseType = this.formatResponseType(endpoint.response, ir)
            lines.push(`- Type: \`${responseType}\``)
            lines.push(`- Status: ${endpoint.response.statusCode}`)
            lines.push('')
        }

        return [{
            path: 'API_DOCUMENTATION.md',
            content: lines.join('\n'),
            metadata: {
                emitter: 'DocumentationEmitter',
                generatedAt: new Date().toISOString(),
                dependencies: []
            }
        }]
    }

    private formatSemanticType(semanticType: any): string {
        switch (semanticType.kind) {
            case 'primitive':
                return semanticType.type
            case 'resource':
                const base = semanticType.resource
                return semanticType.collection ? `${base}[]` : base
            case 'model':
                return semanticType.model
            case 'array':
                return `${this.formatSemanticType(semanticType.items)}[]`
            default:
                return 'unknown'
        }
    }

    private formatResponseType(response: any, ir: ContractIR): string {
        if (!response.resource) return 'unknown'

        const resource = ir.resources.find(r => r.name === response.resource)
        if (!resource) return response.resource

        const baseName = resource.name.replace('Resource', 'Transformed')

        switch (response.type) {
            case 'collection':
                return `${baseName}[]`
            case 'paginated':
                return `PaginatedResponse<${baseName}>`
            default:
                return baseName
        }
    }
}

// =============================================================================
// 4. UNIFIED GENERATION WITH CUSTOM EMITTERS
// =============================================================================

async function demonstrateUnifiedGeneration() {
    console.log('🚀 Running Unified Generation with Custom Emitters...\n')

    const generator = new ContractGenerator()

    // Add custom emitters
    generator.addEmitter(new GraphQLEmitter())
    generator.addEmitter(new DocumentationEmitter())

    const result = await generator.generate(sampleManifest)

    console.log('📁 Generated Files:')
    result.files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.path} (${file.metadata?.emitter})`)
    })
    console.log('')

    console.log('📊 Generation Statistics:')
    console.log(`  Total Files: ${result.metadata.stats.fileCount}`)
    console.log(`  Resources Processed: ${result.metadata.stats.resourceCount}`)
    console.log(`  Endpoints Processed: ${result.metadata.stats.endpointCount}`)
    console.log(`  Build Time: ${result.metadata.performance.buildTime.toFixed(2)}ms`)
    console.log(`  Emit Time: ${result.metadata.performance.emitTime.toFixed(2)}ms`)
    console.log('')

    // Show sample output
    const graphqlFile = result.files.find(f => f.path === 'schema.graphql')
    if (graphqlFile) {
        console.log('📄 Sample GraphQL Schema Output:')
        console.log('```graphql')
        console.log(graphqlFile.content.split('\n').slice(0, 15).join('\n'))
        console.log('...')
        console.log('```')
        console.log('')
    }

    return result
}

// =============================================================================
// 5. IR DEBUGGING AND INSPECTION
// =============================================================================

async function demonstrateIRDebugging() {
    console.log('🔍 IR Debugging and Inspection...\n')

    const generator = new ContractGenerator()

    // Export IR for inspection
    const ir = await generator.debugExportIR(sampleManifest, 'debug-contract-ir.json')
    console.log('💾 Exported IR to debug-contract-ir.json')
    console.log('')

    // Inspect specific domains
    console.log('🔬 Resource Analysis:')
    ir.resources.forEach(resource => {
        console.log(`  ${resource.name}:`)
        console.log(`    Fields: ${resource.fields.length}`)
        console.log(`    Aliases: ${resource.aliases.length}`)
        console.log(`    Variants: ${resource.variants.length}`)
        console.log(`    Mapper Mappings: ${resource.mapper.mappings.length}`)

        if (resource.metadata.dependencies.length > 0) {
            console.log(`    Dependencies: ${resource.metadata.dependencies.join(', ')}`)
        }
    })
    console.log('')

    console.log('🌐 Endpoint Analysis:')
    ir.endpoints.forEach(endpoint => {
        console.log(`  ${endpoint.method} ${endpoint.path}:`)
        console.log(`    Auth: ${endpoint.metadata.auth}`)
        console.log(`    Path Params: ${endpoint.pathParams.length}`)
        console.log(`    Query Params: ${endpoint.queryParams.length}`)

        if (endpoint.response.resource) {
            console.log(`    Response: ${endpoint.response.resource} (${endpoint.response.type})`)
        }
    })
    console.log('')
}

// =============================================================================
// 6. MAIN EXECUTION
// =============================================================================

async function main() {
    console.log('🎯 Contract IR Architecture Examples\n')
    console.log('='.repeat(60))
    console.log('')

    try {
        // 1. Demonstrate IR building
        const ir = await demonstrateIRBuilding()

        // 2. Demonstrate unified generation
        await demonstrateUnifiedGeneration()

        // 3. Demonstrate debugging
        await demonstrateIRDebugging()

        console.log('✅ All examples completed successfully!')
        console.log('')
        console.log('Key Takeaways:')
        console.log('- IR centralizes all transformations (snake_case → camelCase)')
        console.log('- Emitters are thin projection functions')
        console.log('- Adding new emitters is simple and focused')
        console.log('- Generated output is consistent across all formats')
        console.log('- IR can be inspected and debugged easily')

    } catch (error) {
        console.error('❌ Error running examples:', error)
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main()
}

export {
    sampleManifest,
    GraphQLEmitter,
    DocumentationEmitter,
    demonstrateIRBuilding,
    demonstrateUnifiedGeneration,
    demonstrateIRDebugging
}