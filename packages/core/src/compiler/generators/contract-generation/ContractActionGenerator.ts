/**
 * ContractActionGenerator.ts
 * 
 * Groups schemas by action (create/update) and generates action blocks.
 * Structured Constructor consuming ContractSchemaMapper.
 * 
 * @module compiler/generators/contract-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import type { RequestField, FileValidationConstraints } from '../../artifacts/RequestTypesArtifact';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../domain/common/ResponseFieldLowering';
import { ResolvedObjectType, ResolvedOptionalType } from '../../domain/common/ResolvedSemanticType';
import { toZodSchemaExpression } from '../../domain/common/ZodSchemaLowerer';
import { toPascalCase } from '../../../utils/resource-naming';

export interface GeneratedContractAction {
    readonly name: string;
    readonly schemaCode: string;
    readonly typeCode: string;
}

export interface ContractActionGeneratorDependencies {
    readonly resolver?: SemanticTypeResolver;
}

export class ContractActionGenerator {
    private readonly resolver: SemanticTypeResolver;

    constructor({ resolver = defaultTypeResolver }: ContractActionGeneratorDependencies = {}) {
        this.resolver = resolver;
    }

    generateAction(
        actionName: string,
        fields: readonly RequestField[],
        contractSchemaName: string = ''
    ): GeneratedContractAction {
        const resolvedFields = fields.map(f => {
            const key = (f.originalName ?? (f as any).name ?? f.transformedName);
            let resolvedType = this.resolver.resolve(f.type);
            if (!f.required && resolvedType.kind !== 'optional') {
                resolvedType = ResolvedOptionalType.of(resolvedType);
            }
            return [key, resolvedType] as const;
        });
        const resolvedObject = new ResolvedObjectType({ fields: resolvedFields });
        const schemaExpr = toZodSchemaExpression(resolvedObject);

        const formattedAction = toPascalCase(actionName);

        return {
            name: actionName,
            schemaCode: `  ${formattedAction}: ${schemaExpr}`,
            typeCode: contractSchemaName ? `  ${formattedAction}: z.infer<typeof ${contractSchemaName}.${formattedAction}>;` : ''
        };
    }
}