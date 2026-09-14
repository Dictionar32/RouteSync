/**
 * FormModelProjector.ts
 *
 * Stream Projector for Form Types (api-form.ts).
 * Projects RequestTypesArtifact into TypeScript form interface definitions.
 *
 * @module compiler/projectors
 */

import type { CodeSink } from '../sink/CodeSink';
import type { RequestTypesArtifact } from '../artifacts/RequestTypesArtifact';
import type { GeneratedFormArtifact } from '../artifacts/GeneratedFormArtifact';
import { FormActionGenerator } from '../generators/form-generation/FormActionGenerator';
import { FormCodeBuilder, type FormTypeDefinition } from '../generators/form-generation/FormCodeBuilder';
import { defaultTypeResolver } from '../domain/common/ResponseFieldLowering';

export interface FormProjectorDependencies {
    readonly actionGenerator?: FormActionGenerator;
    readonly codeBuilder?: FormCodeBuilder;
}

export class FormModelProjector {
    private readonly actionGenerator: FormActionGenerator;
    private readonly codeBuilder: FormCodeBuilder;

    constructor(deps: FormProjectorDependencies = {}) {
        this.actionGenerator = deps.actionGenerator ?? new FormActionGenerator({ resolver: defaultTypeResolver });
        this.codeBuilder = deps.codeBuilder ?? new FormCodeBuilder({ indentSize: 2 });
    }

    public project(artifact: RequestTypesArtifact, sink: CodeSink): GeneratedFormArtifact {
        const formTypes: FormTypeDefinition[] = artifact.requestTypes.map(reqType => {
            const actions = reqType.actions.map(act =>
                this.actionGenerator.generateAction(act.name, act.fields)
            );
            return {
                resourceName: reqType.resourceName,
                formTypeName: `${reqType.resourceName}Form`,
                actions
            };
        });

        const code = this.codeBuilder.build({ formTypes });
        sink.writeBlock(code);

        return {
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
                requestTypeCount: artifact.requestTypes.length,
                formTypeCount: formTypes.length,
                totalActions: formTypes.reduce((acc, ft) => acc + ft.actions.length, 0),
                linesOfCode: code.split('\n').length,
                warnings: []
            },
            metadata: artifact.metadata
        };
    }
}
