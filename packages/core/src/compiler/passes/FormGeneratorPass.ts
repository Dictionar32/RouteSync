/**
 * FormGeneratorPass.ts
 * 
 * Compiler pass that transforms RequestTypes into Generated Form code.
 * Orchestrates small SoC classes (mapper, generator, builder).
 * 
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness, ResolveArtifacts } from './ArtifactKeyWitness';
import type { GeneratedFormArtifact, GeneratedFormType, GeneratedFormAction } from '../artifacts/GeneratedFormArtifact';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';

import { FormFieldMapper } from '../generators/form-generation/FormFieldMapper';
import { FormActionGenerator, GeneratedAction } from '../generators/form-generation/FormActionGenerator';
import { FormCodeBuilder } from '../generators/form-generation/FormCodeBuilder';
import { computeFingerprintHash, type CompilerFingerprint } from '../fingerprint/Fingerprint';

/**
 * FormGeneratorPass transforms request types into form TypeScript code.
 * 
 * Input:  ['RequestTypes'] - Validation rules grouped by resource
 * Output: ['GeneratedForm'] - Generated form types
 * 
 * Architecture: SoC with small focused classes
 * - FormFieldMapper: validation rules → TypeScript types
 * - FormActionGenerator: fields → action blocks
 * - FormCodeBuilder: action blocks → complete code
 * 
 * This pass orchestrates these pieces dengan dependency injection.
 * 
 * @example
 * ```typescript
 * const pass = new FormGeneratorPass();
 * const manager = new PassManager([]);
 * manager.registerPass(pass);
 * ```
 */
export class FormGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedForm']> {

    /** Pass name untuk identification dan logging */
    public readonly name = 'FormGenerator';

    /** Input witnesses untuk type-safe artifact retrieval */
    public readonly inputWitnesses = [
        new ArtifactKeyWitness('RequestTypes')
    ] as const;

    /** Output keys yang di-produce oleh pass ini */
    public readonly outputKeys = ['GeneratedForm'] as const;

    /** Pass descriptor untuk dependency resolution */
    public readonly descriptor: PassDescriptor = {
        consumes: ['RequestTypes'],
        produces: ['GeneratedForm']
    };

    /** Dependencies - pass ini butuh RequestTypes artifact */
    public readonly requires: readonly PassDependency[] = [
        {
            artifact: 'RequestTypes',
            producer: undefined // External input
        }
    ];

    /** Pass names this produces (none - end of pipeline) */
    public readonly producesPass: readonly string[] = [];

    /** SoC Components - injected via constructor */
    private readonly fieldMapper: FormFieldMapper;
    private readonly actionGenerator: FormActionGenerator;
    private readonly codeBuilder: FormCodeBuilder;

    /**
     * Create FormGeneratorPass dengan dependency injection
     * 
     * @param deps - Optional dependency overrides untuk testing
     */
    constructor(deps?: {
        readonly fieldMapper?: FormFieldMapper;
        readonly actionGenerator?: FormActionGenerator;
        readonly codeBuilder?: FormCodeBuilder;
    }) {
        // Default implementations (can be overridden for testing)
        this.fieldMapper = deps?.fieldMapper ?? new FormFieldMapper();
        this.actionGenerator = deps?.actionGenerator ?? new FormActionGenerator();
        this.codeBuilder = deps?.codeBuilder ?? new FormCodeBuilder();
    }

    /**
     * Execute pass transformation
     * 
     * Orchestration Process:
     * 1. Extract RequestTypes from input
     * 2. For each request type:
     *    a. Map fields using FormFieldMapper
     *    b. Generate actions using FormActionGenerator
     *    c. Collect metadata
     * 3. Build final code using FormCodeBuilder
     * 4. Create GeneratedForm artifact
     * 5. Return artifact in output tuple
     * 
     * @param inputs - Tuple containing RequestTypesArtifact
     * @returns Tuple containing GeneratedFormArtifact
     */
    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedForm']> {
        try {
            // Extract request types artifact
            const requestTypesArtifact = inputs[0] as RequestTypesArtifact;
            const requestTypes = requestTypesArtifact.requestTypes;

            console.log(`[FormGeneratorPass] Processing ${requestTypes.length} request types`);

            // Early exit jika no validation rules
            if (requestTypes.length === 0) {
                return this.buildEmptyArtifact();
            }

            // Process each request type
            const actionsByResource = new Map<string, readonly GeneratedAction[]>();
            const formActionsByResource = new Map<string, readonly GeneratedFormAction[]>();
            const formTypes: GeneratedFormType[] = [];
            const warnings: string[] = [];
            let totalActions = 0;

            for (const requestType of requestTypes) {
                try {
                    // Generate actions untuk each request type
                    const generatedActions = this.processRequestTypeActions(requestType);

                    // Store GeneratedAction for code building
                    actionsByResource.set(requestType.resourceName, generatedActions);

                    // Convert to GeneratedFormAction for artifact
                    const formActions: GeneratedFormAction[] = generatedActions.map(a => ({
                        name: a.name,
                        fieldCount: a.fieldCount,
                        lineRange: [0, 0] as const // Will be computed after code building
                    }));
                    formActionsByResource.set(requestType.resourceName, formActions);

                    // Collect metadata
                    formTypes.push({
                        name: requestType.formTypeName,
                        actions: formActions,
                        lineRange: [0, 0] as const
                    });

                    totalActions += generatedActions.length;

                } catch (error) {
                    warnings.push(
                        `Failed to process ${requestType.formTypeName}: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // Build final code
            const builtCode = this.codeBuilder.buildFormTypes(requestTypes, actionsByResource);

            console.log(`[FormGeneratorPass] Generated ${builtCode.formTypeCount} form types with ${totalActions} actions`);

            // Build artifact
            const artifact = this.buildArtifact(builtCode, formTypes, totalActions, warnings);

            // Return as output tuple
            return [artifact] as ResolveArtifacts<readonly ['GeneratedForm']>;

        } catch (error) {
            throw new FormGeneratorPassError(
                `Form generation failed: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Process single request type - generate actions
     * 
     * Delegates to FormActionGenerator untuk actual generation.
     * Returns GeneratedAction (with lines property) for code building.
     */
    private processRequestTypeActions(requestType: RequestTypesArtifact['requestTypes'][number]): readonly GeneratedAction[] {
        const actions: GeneratedAction[] = [];

        for (const action of requestType.actions) {
            const generated = this.actionGenerator.generateAction(
                action.name,
                action.fields
            );

            actions.push(generated);
        }

        return actions;
    }

    /**
     * Build GeneratedForm artifact dari built code
     */
    private buildArtifact(
        builtCode: ReturnType<FormCodeBuilder['buildFormTypes']>,
        formTypes: GeneratedFormType[],
        totalActions: number,
        warnings: string[]
    ): GeneratedFormArtifact {
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
            typeId: 'GeneratedForm',
            code: builtCode.code,
            formTypes,
            generationMetadata: {
                generatorVersion: '1.0.0',
                requestTypeCount: formTypes.length,
                formTypeCount: builtCode.formTypeCount,
                totalActions,
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
     * Build empty artifact ketika no validation rules
     */
    private buildEmptyArtifact(): ResolveArtifacts<readonly ['GeneratedForm']> {
        const builtCode = this.codeBuilder.buildEmptyFile();
        const artifact = this.buildArtifact(builtCode, [], 0, ['No validation rules found']);
        return [artifact] as ResolveArtifacts<readonly ['GeneratedForm']>;
    }
}

/**
 * Custom error class untuk FormGeneratorPass
 */
export class FormGeneratorPassError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'FormGeneratorPassError';
        Object.freeze(this);
    }

    /**
     * Get detailed error message dengan cause chain
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}`;
        if (this.cause) {
            msg += `\n  Caused by: ${this.cause.message}`;
        }
        return msg;
    }
}
