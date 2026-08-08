/**
 * ContractGeneratorPass.ts
 * 
 * Compiler pass that transforms RequestTypes into Generated Contract code with Zod schemas.
 * Orchestrates small SoC classes (mapper, generator, builder) for runtime validation schemas.
 * 
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import type { ArtifactKeyWitness, ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedContractArtifact, GeneratedContractInfo, ContractActionInfo } from '../artifacts/GeneratedContractArtifact';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';

import { ContractSchemaMapper } from '../generators/contract-generation/ContractSchemaMapper';
import { ContractActionGenerator } from '../generators/contract-generation/ContractActionGenerator';
import { ContractCodeBuilder } from '../generators/contract-generation/ContractCodeBuilder';
import { ResponseActionBuilder, type ActionResponseSchema } from '../generators/contract-generation/ResponseActionBuilder';
import { ResponseSchemaMapper } from '../generators/contract-generation/ResponseSchemaMapper';
import { computeFingerprintHash, type CompilerFingerprint } from '../fingerprint/Fingerprint';
import type { ParsedResponseField } from '../generators/contract-generation/ResponseFieldParser';

/**
 * ContractGeneratorPass transforms request types into Zod contract schemas.
 * 
 * Input:  ['RequestTypes'] - Validation rules grouped by resource
 * Output: ['GeneratedContract'] - Generated Zod schemas for runtime validation
 * 
 * Architecture: SoC with small focused classes
 * - ContractSchemaMapper: SemanticType → Zod schema strings (preserves backend structure)
 * - ContractActionGenerator: fields → action blocks with Zod schemas
 * - ContractCodeBuilder: action blocks → complete api-contract.ts (4 sections)
 * 
 * This pass orchestrates these pieces with dependency injection.
 * 
 * Key Difference from FormGeneratorPass:
 * - Generates Zod schemas (not TypeScript types)
 * - Preserves snake_case + nested (no transformation)
 * - 4 sections: schemas + types + validators + exports
 * - Purpose: Runtime validation (not just type definitions)
 * 
 * @example
 * ```typescript
 * const pass = new ContractGeneratorPass();
 * const manager = new PassManager([]);
 * manager.registerPass(pass);
 * ```
 */
export class ContractGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedContract']> {

    /** Pass name for identification and logging */
    public readonly name = 'ContractGenerator';

    /** Input witnesses for type-safe artifact retrieval */
    public readonly inputWitnesses = [
        { key: 'RequestTypes' } as ArtifactKeyWitness<'RequestTypes'>
    ] as const;

    /** Output keys that this pass produces */
    public readonly outputKeys = ['GeneratedContract'] as const;

    /** Pass descriptor for dependency resolution */
    public readonly descriptor: PassDescriptor = {
        consumes: ['RequestTypes'],
        produces: ['GeneratedContract']
    };

    /** Dependencies - this pass requires RequestTypes artifact */
    public readonly requires: readonly PassDependency[] = [
        {
            artifact: 'RequestTypes',
            producer: undefined // External input
        }
    ];

    /** Pass names this produces (none - end of pipeline) */
    public readonly producesPass: readonly string[] = [];

    /** SoC Components - injected via constructor */
    private readonly schemaMapper: ContractSchemaMapper;
    private readonly actionGenerator: ContractActionGenerator;
    private readonly codeBuilder: ContractCodeBuilder;
    private readonly responseActionBuilder: ResponseActionBuilder;

    /**
     * Create ContractGeneratorPass with dependency injection
     * 
     * @param deps - Optional dependency overrides for testing
     */
    constructor(deps?: {
        readonly schemaMapper?: ContractSchemaMapper;
        readonly actionGenerator?: ContractActionGenerator;
        readonly codeBuilder?: ContractCodeBuilder;
        readonly responseActionBuilder?: ResponseActionBuilder;
    }) {
        // Default implementations (can be overridden for testing)
        this.schemaMapper = deps?.schemaMapper ?? new ContractSchemaMapper();
        this.actionGenerator = deps?.actionGenerator ?? new ContractActionGenerator(
            deps?.schemaMapper ?? new ContractSchemaMapper()
        );
        this.codeBuilder = deps?.codeBuilder ?? new ContractCodeBuilder();
        this.responseActionBuilder = deps?.responseActionBuilder ?? new ResponseActionBuilder(
            new ResponseSchemaMapper()
        );
    }

    /**
     * Execute pass transformation
     * 
     * Orchestration Process:
     * 1. Extract RequestTypes from input
     * 2. For each request type:
     *    a. Generate actions with ContractActionGenerator
     *    b. ContractActionGenerator uses ContractSchemaMapper for Zod schemas
     *    c. Collect metadata
     * 3. Build final code using ContractCodeBuilder (4 sections)
     * 4. Create GeneratedContract artifact
     * 5. Return artifact in output tuple
     * 
     * @param inputs - Tuple containing RequestTypesArtifact
     * @returns Tuple containing GeneratedContractArtifact
     */
    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedContract']> {
        try {
            // Extract request types artifact
            const requestTypesArtifact = inputs[0] as RequestTypesArtifact;
            const requestTypes = requestTypesArtifact.requestTypes;

            console.log(`[ContractGeneratorPass] Processing ${requestTypes.length} request types`);

            // Early exit if no validation rules
            if (requestTypes.length === 0) {
                return this.buildEmptyArtifact();
            }

            // Process each request type
            const allContracts: Array<{ resourceName: string, actions: [] }> = [];
            const warnings: string[] = [];
            let totalActions = 0;
            let zodSchemasCount = 0;
            let validatorsCount = 0;

            // ✅ NEW: Store response schemas separately
            const allResponseSchemas: ActionResponseSchema[] = [];

            for (const requestType of requestTypes) {
                try {
                    // Generate actions for each request type
                    const actions = this.processRequestType(requestType);

                    // Store in format expected by ContractCodeBuilder
                    allContracts.push({
                        resourceName: requestType.resourceName,
                        actions
                    });

                    totalActions += actions.length;
                    zodSchemasCount += actions.length;
                    validatorsCount += actions.length;

                    // ✅ NEW: Process response types if available
                    const responseSchemas = this.processResponseTypes(requestType);
                    allResponseSchemas.push(...responseSchemas);

                    console.log(
                        `[ContractGeneratorPass] ${requestType.resourceName}: ` +
                        `${actions.length} request actions, ${responseSchemas.length} response schemas`
                    );

                } catch (error) {
                    warnings.push(
                        `Failed to process ${requestType.formTypeName}: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // Build final code (4 sections)
            const builtCode = this.codeBuilder.buildContractFile(allContracts);

            console.log(`[ContractGeneratorPass] Generated ${allContracts.length} contracts with ${totalActions} actions`);
            console.log(`[ContractGeneratorPass] Generated ${allResponseSchemas.length} response schemas`);

            // TODO Step 6.1: Store response schemas in artifact
            // Currently response schemas are generated but not written to output
            // Next step: Extend GeneratedContractArtifact to include response section
            // or modify ContractCodeBuilder to output response schemas

            // Build contract info for artifact metadata
            const contractsInfo: GeneratedContractInfo[] = allContracts.map((contract, index) => ({
                name: contract.resourceName,
                schemaName: `${contract.resourceName}ContractSchema`,
                actions: contract.actions.map(a => ({
                    name: a.name,
                    zodSchema: a.schemaLines.join('\n'),
                    validatorName: `validate${contract.resourceName}${this.capitalize(a.name)}`,
                    fieldCount: a.fieldCount
                })),
                lineRange: [0, 0] as const // Will be computed from sections
            }));

            // Build artifact
            const artifact = this.buildArtifact(
                builtCode,
                contractsInfo,
                totalActions,
                zodSchemasCount,
                validatorsCount,
                warnings
            );

            // Return as output tuple
            return [artifact] as ResolveArtifacts<readonly ['GeneratedContract']>;

        } catch (error) {
            throw new ContractGeneratorPassError(
                `Contract generation failed: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Process single request type - generate actions with Zod schemas
     * 
     * Delegates to ContractActionGenerator for actual generation.
     * Returns data structure compatible with ContractCodeBuilder.
     */
    private processRequestType(requestType: RequestTypesArtifact['requestTypes'][number]) {
        const actions = [];

        for (const action of requestType.actions) {
            // Convert RequestTypesArtifact fields to ContractField format
            const contractFields = action.fields.map(field => ({
                name: field.originalName, // Use original snake_case name
                type: field.type,
                required: field.required,
                nullable: field.nullable
            }));

            const generated = this.actionGenerator.generateAction(
                action.name,
                contractFields
            );
            actions.push(generated);
        }

        return actions;
    }

    /**
     * Process response types from requestType.responseData
     * 
     * Generates response schemas for show/index actions.
     * Only processes if responseData exists.
     * 
     * @param requestType - Request type with optional responseData
     * @returns Response schemas for show/index (empty if no responseData)
     */
    private processResponseTypes(
        requestType: RequestTypesArtifact['requestTypes'][number]
    ): ActionResponseSchema[] {
        // Early exit if no response data
        if (!requestType.responseData) {
            return [];
        }

        const { resourceName, fields } = requestType.responseData;

        console.log(`[ContractGeneratorPass] Processing response for ${resourceName}`);
        console.log(`[ContractGeneratorPass] Fields:`, Object.keys(fields));

        // Convert SemanticType fields to ParsedResponseField format
        const parsedFields = this.convertResponseFields(fields);

        console.log(`[ContractGeneratorPass] Converted ${parsedFields.length} fields`);

        // Generate schemas for both show and index
        const schemas: ActionResponseSchema[] = [];

        try {
            // Build show schema (single resource)
            const showSchema = this.responseActionBuilder.buildShowSchema(
                resourceName,
                parsedFields
            );
            schemas.push(showSchema);

            // Build index schema (array of resources)
            const indexSchema = this.responseActionBuilder.buildIndexSchema(
                resourceName,
                parsedFields
            );
            schemas.push(indexSchema);

            console.log(`[ContractGeneratorPass] Generated 2 response schemas for ${resourceName}`);
        } catch (error) {
            console.error(
                `[ContractGeneratorPass] Error generating response schemas for ${resourceName}:`,
                error
            );
        }

        return schemas;
    }

    /**
     * Convert SemanticType fields to ParsedResponseField format
     * 
     * Maps from Record<string, SemanticType> to ParsedResponseField[].
     * Handles primitive, object, and array types.
     * 
     * @param fields - Record of field name to SemanticType
     * @returns Array of ParsedResponseField
     */
    private convertResponseFields(
        fields: Record<string,>
    ): ParsedResponseField[] {
        const result: ParsedResponseField[] = [];

        for (const [fieldName, semanticType] of Object.entries(fields)) {
            try {
                const parsed = this.convertSingleField(fieldName, semanticType);
                result.push(parsed);
            } catch (error) {
                console.warn(
                    `[ContractGeneratorPass] Failed to convert field ${fieldName}:`,
                    error
                );
                // Skip this field and continue
            }
        }

        return result;
    }

    /**
     * Convert single SemanticType to ParsedResponseField
     * 
     * Handles different SemanticType variants:
     * - PrimitiveType → primitive kind
     * - ObjectType → object kind with nested fields
     * - ArrayType → array kind with itemType
     * 
     * @param fieldName - Name of the field
     * @param semanticType - SemanticType instance
     * @returns ParsedResponseField
     */
    private convertSingleField(
        fieldName: string,
        semanticType: any
    ): ParsedResponseField {
        // Handle primitive types
        if (
            semanticType.kind === 'primitive' ||
            semanticType.type === 'string' ||
            semanticType.type === 'number' ||
            semanticType.type === 'boolean'
        ) {
            return {
                name: fieldName,
                kind: 'primitive',
                type: semanticType.type || 'string',
                nullable: semanticType.nullable ?? false,
                optional: semanticType.optional ?? false
            };
        }

        // Handle object types
        if (semanticType.kind === 'object' || semanticType.properties) {
            const nestedFields: ParsedResponseField[] = [];

            if (semanticType.properties) {
                // Convert Map or Record to nested fields
                const props = semanticType.properties instanceof Map
                    ? Array.from(semanticType.properties.entries())
                    : Object.entries(semanticType.properties);

                for (const [propName, propType] of props) {
                    nestedFields.push(
                        this.convertSingleField(propName, propType)
                    );
                }
            }

            return {
                name: fieldName,
                kind: 'object',
                type: 'object',
                nullable: semanticType.nullable ?? false,
                optional: semanticType.optional ?? false,
                fields: nestedFields
            };
        }

        // Handle array types
        if (semanticType.kind === 'array' || semanticType.itemType) {
            const itemType = semanticType.itemType || semanticType.elementType;

            return {
                name: fieldName,
                kind: 'array',
                type: 'array',
                nullable: semanticType.nullable ?? false,
                optional: semanticType.optional ?? false,
                itemType: itemType
                    ? this.convertSingleField('item', itemType)
                    : {
                        name: 'item',
                        kind: 'primitive',
                        type: 'unknown',
                        nullable: false,
                        optional: false
                    }
            };
        }

        // Default: treat as primitive string
        return {
            name: fieldName,
            kind: 'primitive',
            type: 'string',
            nullable: false,
            optional: false
        };
    }

    /**
     * Build GeneratedContract artifact from built code
     */
    private buildArtifact(
        builtCode: ReturnType<ContractCodeBuilder['buildContractFile']>,
        contractsInfo: GeneratedContractInfo[],
        totalActions: number,
        zodSchemasCount: number,
        validatorsCount: number,
        warnings: string[]
    ): GeneratedContractArtifact {
        const fingerprint: CompilerFingerprint = {
            compilerVersion: '1.0.0',
            parserVersion: '1.0.0',
            phpVersion: '8.2.0',
            frameworkVersion: '10.0.0',
            targetBackend: 'typescript',
            strictMode: false,
            featureFlags: new Map()
        };

        return {
            typeId: 'GeneratedContract',
            code: builtCode.code,
            contracts: contractsInfo,
            generationMetadata: {
                generatorVersion: '1.0.0',
                requestTypeCount: contractsInfo.length,
                contractCount: builtCode.contractCount,
                totalActions,
                zodSchemasCount,
                validatorsCount,
                linesOfCode: builtCode.lineCount,
                warnings
            },
            metadata: {
                hash: computeFingerprintHash(fingerprint),
                producer: this.name,
                dependencies: ['RequestTypes'],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        };
    }

    /**
     * Build empty artifact when no validation rules
     */
    private buildEmptyArtifact(): ResolveArtifacts<readonly ['GeneratedContract']> {
        // Use buildContractFile with empty array - it handles empty case
        const emptyCode = this.codeBuilder.buildContractFile([]);
        const artifact = this.buildArtifact(
            emptyCode,
            [],
            0,
            0,
            0,
            ['No validation rules found']
        );
        return [artifact] as ResolveArtifacts<readonly ['GeneratedContract']>;
    }

    /**
     * Capitalize first letter of string
     */
    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

/**
 * Custom error class for ContractGeneratorPass
 */
export class ContractGeneratorPassError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'ContractGeneratorPassError';
        Object.freeze(this);
    }

    /**
     * Get detailed error message with cause chain
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}`;
        if (this.cause) {
            msg += `\n  Caused by: ${this.cause.message}`;
        }
        return msg;
    }
}
