/**
 * ContractActionGenerator.ts
 *
 * Groups schemas by action (create/update) and generates action blocks.
 * Structured Constructor consuming ContractSchemaMapper.
 *
 * @module compiler/generators/contract-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import type { FileValidationConstraints } from '../../../types/domain/request';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../domain/common/ResponseFieldLowering';
import { ResolvedObjectType } from '../../domain/common/ResolvedSemanticType';
import { toZodSchemaExpression } from '../../domain/common/ZodSchemaLowerer';
import { toPascalCase } from '../../../utils/resource-naming';

export interface ActionField {
    readonly name: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly fileConstraints?: FileValidationConstraints;
}

export interface GeneratedContractAction {
    readonly name: string;
    readonly schemaCode: string;
    readonly typeCode: string;
    readonly fieldCount: number;
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
        fields: readonly ActionField[],
        contractSchemaName: string = ''
    ): GeneratedContractAction {
        const resolvedFields = fields.map(f => {
            return {
                name: f.name,
                type: this.resolver.resolve(f.type),
                presence: f.required
            };
        });
        const resolvedObject = ResolvedObjectType.plain(resolvedFields);
        const schemaExpr = toZodSchemaExpression(resolvedObject);

        const formattedAction = toPascalCase(actionName);

        return {
            name: actionName,
            schemaCode: `  ${formattedAction}: ${schemaExpr}`,
            typeCode: contractSchemaName ? `  ${formattedAction}: z.infer<typeof ${contractSchemaName}.${formattedAction}>;` : '',
            fieldCount: fields.length
        };
    }
}
