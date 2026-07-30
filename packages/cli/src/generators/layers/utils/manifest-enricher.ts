/**
 * Manifest Enrichment Utilities
 * 
 * Fixes missing Resources & Models data in manifest:
 * - Infers resources dari route response metadata
 * - Generates model definitions dari response shapes
 * - Creates type relationships dan dependencies
 */

import { RouteManifest } from '../../../../../core/src/types/route'
import { IdentifierSanitizer } from './identifier-sanitizer'

export interface EnrichedManifest extends RouteManifest {
    enrichmentMetadata: EnrichmentMetadata
}

export interface ResourceDefinition {
    name: string                    // "UserResource"
    sanitizedName: string          // "User" 
    baseModel?: string             // "User"
    endpoints: string[]            // Route IDs yang menggunakan resource ini
    actions: ActionDefinition[]    // CRUD actions available
}

export interface ModelDefinition {
    name: string                   // "User"
    sanitizedName: string         // "User"
    table: string                 // "users"
    columns: ColumnDefinition[]   // Properties dari model
    source: 'inferred' | 'explicit'
}

export interface ColumnDefinition {
    name: string                  // "user_name"
    type: string                 // "varchar", "int", "boolean"
    nullable: boolean
}

export interface ActionDefinition {
    name: string                   // "index", "show", "create", "update"
    method: string                // "GET", "POST", etc.
    hasBody: boolean
    hasResponse: boolean
    routes: string[]              // Route IDs untuk action ini
}

export interface FieldDefinition {
    name: string                  // "user_name"
    sanitizedName: string        // "userName" 
    type: string                 // "string", "number", "boolean"
    nullable: boolean
    source: 'schema' | 'response' | 'inferred'
}

export interface EnrichmentMetadata {
    resourcesFound: number
    modelsInferred: number
    fieldsExtracted: number
    enrichmentTime: number
    warnings: string[]
}

export class ManifestEnricher {
    static enrich(manifest: RouteManifest): EnrichedManifest {
        const startTime = performance.now()
        const warnings: string[] = []

        console.log('🔍 Enriching manifest with missing Resources & Models...')

        // Step 1: Extract resources dari route responses
        const resourcesMap = this.extractResources(manifest, warnings)

        // Step 2: Infer models dari routes dan resources
        const modelsMap = this.inferModels(manifest, resourcesMap, warnings)

        // Step 3: Build action definitions per resource
        this.buildActionDefinitions(manifest, resourcesMap, warnings)

        const enrichmentTime = performance.now() - startTime
        const resourceDefinitions = Array.from(resourcesMap.values())
        const modelDefinitions = Array.from(modelsMap.values())

        // Convert to RouteManifest compatible format
        const parsedResources = resourceDefinitions.map(rd => ({
            name: rd.name,
            sanitizedName: rd.sanitizedName,
            baseModel: rd.baseModel,
            actions: rd.actions,
            endpoints: rd.endpoints,
            fields: {} as Record<string, any>, // Empty for now, can be enhanced later
            sourceFile: null,
            sourceLine: null
        }))

        const parsedModels = modelDefinitions.map(md => ({
            name: md.name,
            table: md.table,
            columns: md.columns.map(col => ({
                name: col.name,
                type: col.type,
                nullable: col.nullable
            }))
        }))

        console.log(`✅ Manifest enriched in ${enrichmentTime.toFixed(2)}ms:`)
        console.log(`   - Resources: ${resourceDefinitions.length}`)
        console.log(`   - Models: ${modelDefinitions.length}`)
        console.log(`   - Warnings: ${warnings.length}`)

        return {
            ...manifest,
            resources: [...(manifest.resources || []), ...parsedResources],
            models: [...(manifest.models || []), ...parsedModels],
            enrichmentMetadata: {
                resourcesFound: resourceDefinitions.length,
                modelsInferred: modelDefinitions.length,
                fieldsExtracted: modelDefinitions.reduce((sum, model) => sum + model.columns.length, 0),
                enrichmentTime,
                warnings
            }
        }
    }

    private static extractResources(manifest: RouteManifest, warnings: string[]): Map<string, ResourceDefinition> {
        const resourcesMap = new Map<string, ResourceDefinition>()

        for (const route of manifest.routes || []) {
            if (!route.response) continue

            // Extract resource name dari response metadata
            let resourceName = this.getResourceNameFromResponse(route.response)
            if (!resourceName) continue

            const sanitizedName = IdentifierSanitizer.toPascalCase(resourceName)

            if (!IdentifierSanitizer.isValidIdentifier(sanitizedName)) {
                warnings.push(`Invalid resource identifier: ${resourceName} → ${sanitizedName}`)
                continue
            }

            // Get atau create resource definition
            let resource = resourcesMap.get(resourceName)
            if (!resource) {
                resource = {
                    name: resourceName,
                    sanitizedName,
                    baseModel: this.extractBaseModelName(resourceName),
                    endpoints: [],
                    actions: []
                }
                resourcesMap.set(resourceName, resource)
            }

            // Add route ke resource
            const routeId = route.name || `${route.method}_${route.path}`
            if (!resource.endpoints.includes(routeId)) {
                resource.endpoints.push(routeId)
            }
        }

        return resourcesMap
    }

    private static inferModels(
        manifest: RouteManifest,
        resourcesMap: Map<string, ResourceDefinition>,
        warnings: string[]
    ): Map<string, ModelDefinition> {
        const modelsMap = new Map<string, ModelDefinition>()

        // Infer dari resources
        for (const resource of resourcesMap.values()) {
            if (resource.baseModel) {
                const modelName = resource.baseModel
                const sanitizedName = IdentifierSanitizer.toPascalCase(modelName)

                if (!modelsMap.has(modelName)) {
                    modelsMap.set(modelName, {
                        name: modelName,
                        sanitizedName,
                        table: this.inferTableName(modelName),
                        columns: this.inferColumnsFromResource(manifest, resource, warnings),
                        source: 'inferred'
                    })
                }
            }
        }

        // Infer dari route schemas
        for (const route of manifest.routes || []) {
            if (route.schema?.rules) {
                // Create model dari route schema rules
                const resourceName = IdentifierSanitizer.extractResourceName(route.path, route.name)
                const modelName = IdentifierSanitizer.toPascalCase(resourceName)

                if (!modelsMap.has(modelName)) {
                    modelsMap.set(modelName, {
                        name: modelName,
                        sanitizedName: modelName,
                        table: this.inferTableName(modelName),
                        columns: this.inferColumnsFromSchema(route.schema.rules as Record<string, string>, warnings),
                        source: 'inferred'
                    })
                }
            }
        }

        return modelsMap
    }

    private static buildActionDefinitions(
        manifest: RouteManifest,
        resourcesMap: Map<string, ResourceDefinition>,
        warnings: string[]
    ): void {
        for (const resource of resourcesMap.values()) {
            const actionsMap = new Map<string, ActionDefinition>()

            // Group routes by action
            for (const routeId of resource.endpoints) {
                const route = (manifest.routes || []).find(r =>
                    (r.name || `${r.method}_${r.path}`) === routeId
                )
                if (!route) continue

                const actionName = this.mapMethodToAction(route.method, route.path)

                let action = actionsMap.get(actionName)
                if (!action) {
                    action = {
                        name: actionName,
                        method: route.method,
                        hasBody: ['POST', 'PUT', 'PATCH'].includes(route.method),
                        hasResponse: true,
                        routes: []
                    }
                    actionsMap.set(actionName, action)
                }

                action.routes.push(routeId)
            }

            resource.actions = Array.from(actionsMap.values())
        }
    }

    private static getResourceNameFromResponse(response: any): string | null {
        // Try different approaches untuk extract resource name
        if (response.resource) {
            return response.resource
        }

        if (response.model) {
            return response.model
        }

        if (response.resolved?.model) {
            return response.resolved.model
        }

        if (response.kind === 'resource' && response.type) {
            return response.type
        }

        return null
    }

    private static extractBaseModelName(resourceName: string): string {
        // Remove "Resource" suffix jika ada
        if (resourceName.endsWith('Resource')) {
            return resourceName.slice(0, -8) // Remove "Resource"
        }

        // Remove "Response" suffix jika ada  
        if (resourceName.endsWith('Response')) {
            return resourceName.slice(0, -8) // Remove "Response"
        }

        return resourceName
    }

    private static inferTableName(modelName: string): string {
        // Convert ModelName to table_name
        return modelName
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            + 's' // Add plural suffix
    }

    private static inferColumnsFromResource(
        manifest: RouteManifest,
        resource: ResourceDefinition,
        warnings: string[]
    ): ColumnDefinition[] {
        const columns: ColumnDefinition[] = []

        // Try to find schema rules dari routes yang use resource ini
        for (const routeId of resource.endpoints) {
            const route = (manifest.routes || []).find(r =>
                (r.name || `${r.method}_${r.path}`) === routeId
            )

            if (route?.schema?.rules) {
                columns.push(...this.inferColumnsFromSchema(route.schema.rules as Record<string, string>, warnings))
            }
        }

        // Add default columns jika tidak ada
        if (columns.length === 0) {
            columns.push(
                {
                    name: 'id',
                    type: 'bigint',
                    nullable: false
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    nullable: true
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    nullable: true
                }
            )
        }

        return columns
    }

    private static inferColumnsFromSchema(rules: Record<string, string>, warnings: string[]): ColumnDefinition[] {
        const columns: ColumnDefinition[] = []

        for (const [fieldName, rule] of Object.entries(rules)) {
            const type = this.inferSqlTypeFromRule(rule)
            const nullable = !rule.includes('required')

            columns.push({
                name: fieldName,
                type,
                nullable
            })
        }

        return columns
    }

    private static inferSqlTypeFromRule(rule: string): string {
        const ruleLower = rule.toLowerCase()

        if (ruleLower.includes('email') || ruleLower.includes('string')) {
            return 'varchar'
        }

        if (ruleLower.includes('integer') || ruleLower.includes('numeric')) {
            return 'int'
        }

        if (ruleLower.includes('boolean')) {
            return 'boolean'
        }

        if (ruleLower.includes('array')) {
            return 'json'
        }

        if (ruleLower.includes('json')) {
            return 'json'
        }

        if (ruleLower.includes('date')) {
            return 'timestamp'
        }

        // Default fallback
        return 'varchar'
    }

    private static mapMethodToAction(method: string, path: string): string {
        const hasParam = path.includes('{') || path.includes(':')

        switch (method.toUpperCase()) {
            case 'GET':
                return hasParam ? 'show' : 'index'
            case 'POST':
                return 'create'
            case 'PUT':
            case 'PATCH':
                return 'update'
            case 'DELETE':
                return 'destroy'
            default:
                return method.toLowerCase()
        }
    }

    /**
     * Test function untuk validate enrichment process
     */
    static test(manifest: RouteManifest): void {
        console.log('🧪 Testing Manifest Enrichment...')
        console.log('='.repeat(40))

        const enriched = this.enrich(manifest)

        console.log('📊 Enrichment Results:')
        console.log(`   Original routes: ${manifest.routes?.length || 0}`)
        console.log(`   Original resources: ${manifest.resources?.length || 0}`)
        console.log(`   Original models: ${manifest.models?.length || 0}`)
        console.log('')
        console.log(`   Enriched resources: ${enriched.resources?.length || 0}`)
        console.log(`   Enriched models: ${enriched.models?.length || 0}`)
        console.log(`   Total fields: ${enriched.enrichmentMetadata.fieldsExtracted}`)
        console.log(`   Warnings: ${enriched.enrichmentMetadata.warnings.length}`)

        if (enriched.enrichmentMetadata.warnings.length > 0) {
            console.log('\n⚠️  Warnings:')
            enriched.enrichmentMetadata.warnings.forEach(warning =>
                console.log(`   - ${warning}`)
            )
        }

        console.log('\n📦 Resources found:')
        enriched.resources?.forEach(resource => {
            console.log(`   - ${resource.name} (${(resource as any).sanitizedName || 'N/A'})`)
            console.log(`     Base model: ${(resource as any).baseModel || 'none'}`)
            console.log(`     Actions: ${(resource as any).actions?.map((a: any) => a.name).join(', ') || 'none'}`)
            console.log(`     Endpoints: ${(resource as any).endpoints?.length || 0}`)
        })

        console.log('\n🏗️  Models inferred:')
        enriched.models?.forEach(model => {
            console.log(`   - ${model.name}`)
            console.log(`     Table: ${model.table}`)
            console.log(`     Columns: ${model.columns?.length || 0}`)
        })

        console.log('\n✅ Enrichment test completed!')
    }
}