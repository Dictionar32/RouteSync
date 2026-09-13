/**
 * dependencies.ts
 *
 * Dependency Origin Boundary for ContractGeneratorPass.
 * Resolves optional configuration into a Complete Contract.
 *
 * @module compiler/passes/contract-domain/dependencies
 */

import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator';
import { ContractSchemaMapper } from '../../generators/contract-generation/ContractSchemaMapper';
import { ContractCodeBuilder } from '../../generators/contract-generation/ContractCodeBuilder';
import { ResponseActionBuilder } from '../../generators/contract-generation/ResponseActionBuilder';
import { ResponseSchemaMapper } from '../../generators/contract-generation/ResponseSchemaMapper';
import type { ContractGeneratorDependencies } from './contractTypes';

/**
 * Dependency Origin Boundary: Resolves optional configuration into a Complete Contract.
 * Utilizes ES6 Destructuring Defaults (=) left-to-right (0% ??, 0% ?.).
 */
export function createContractGeneratorDependencies({
    schemaMapper = new ContractSchemaMapper(),
    actionGenerator = new ContractActionGenerator(),
    codeBuilder = new ContractCodeBuilder(),
    responseActionBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
}: Partial<ContractGeneratorDependencies> = {}): ContractGeneratorDependencies {
    return {
        schemaMapper,
        actionGenerator,
        codeBuilder,
        responseActionBuilder
    };
}
