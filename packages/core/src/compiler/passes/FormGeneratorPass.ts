/**
 * FormGeneratorPass.ts
 *
 * Compiler pass that generates TypeScript Form types for mutation requests.
 * Consumes RequestTypes artifact and outputs GeneratedForm artifact.
 *
 * @module compiler/passes
 */

import type { CompilerPass } from './CompilerPass';
import type { PassDescriptor, PassDependency } from './PassDescriptor';
import { ArtifactKeyWitness } from './ArtifactKeyWitness';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedFormArtifact } from '../artifacts/GeneratedFormArtifact';
import { FormActionGenerator } from '../generators/form-generation/FormActionGenerator';
import { FormCodeBuilder, type FormTypeDefinition } from '../generators/form-generation/FormCodeBuilder';
import { SemanticTypeResolver } from '../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../domain/common/ResponseFieldLowering';

export interface FormGeneratorPassDependencies {
    readonly indentSize?: number;
    readonly includeJsDoc?: boolean;
    readonly actionGenerator?: FormActionGenerator;
    readonly codeBuilder?: FormCodeBuilder;
    readonly resolver?: SemanticTypeResolver;
}

export class FormGeneratorPass implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedForm']> {
    public readonly name = 'FormGenerator';
    public readonly inputWitnesses = [new ArtifactKeyWitness('RequestTypes')] as const;
    public readonly outputKeys = ['GeneratedForm'] as const;

    public readonly descriptor: PassDescriptor<readonly ['RequestTypes'], readonly ['GeneratedForm']> = {
        consumes: ['RequestTypes'],
        produces: ['GeneratedForm']
    };

    public readonly requires: readonly PassDependency<'RequestTypes'>[] = [
        { artifact: 'RequestTypes' }
    ];

    public readonly producesPass: readonly string[] = [];

    public readonly indentSize: number;
    public readonly includeJsDoc: boolean;
    private readonly actionGenerator: FormActionGenerator;
    private readonly codeBuilder: FormCodeBuilder;
    private readonly resolver: SemanticTypeResolver;

    constructor({
        indentSize = 2,
        includeJsDoc = true,
        resolver = defaultTypeResolver,
        actionGenerator = new FormActionGenerator({ resolver }),
        codeBuilder = new FormCodeBuilder({ indentSize })
    }: FormGeneratorPassDependencies = {}) {
        this.indentSize = indentSize;
        this.includeJsDoc = includeJsDoc;
        this.resolver = resolver;
        this.actionGenerator = actionGenerator;
        this.codeBuilder = codeBuilder;
        Object.freeze(this);
    }

    run([requestTypesArtifact]: readonly [RequestTypesArtifact]): readonly [GeneratedFormArtifact] {
        const formTypes: FormTypeDefinition[] = [];

        for (const reqType of requestTypesArtifact.requestTypes) {
            const actions = reqType.actions.map(act =>
                this.actionGenerator.generateAction(act.name, act.fields)
            );
            formTypes.push({
                resourceName: reqType.resourceName,
                formTypeName: `${reqType.resourceName}Form`,
                actions
            });
        }

        const code = this.codeBuilder.build({ formTypes });

        return [{
            typeId: 'GeneratedForm',
            code,
            formTypes: formTypes.map(ft => ({
                name: ft.formTypeName,
                actions: ft.actions.map(a => ({
                    name: a.name,
                    fieldCount: a.fieldCount,
                    lineRange: [1, 1] as const
                })),
                lineRange: [1, 1] as const
            })),
            generationMetadata: {
                generatorVersion: '1.0.0',
                requestTypeCount: requestTypesArtifact.requestTypes.length,
                formTypeCount: formTypes.length,
                totalActions: formTypes.reduce((acc, ft) => acc + ft.actions.length, 0),
                linesOfCode: code.split('\n').length,
                warnings: []
            },
            metadata: requestTypesArtifact.metadata
        }];
    }
}