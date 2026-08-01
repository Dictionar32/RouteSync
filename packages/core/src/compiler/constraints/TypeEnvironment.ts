/**
 * TypeEnvironment.ts
 * Type environment for constraint solving
 */

import type { SemanticType } from '../types/SemanticType';

export class TypeEnvironment {
    constructor(private readonly bindings: ReadonlyMap<number, SemanticType> = new Map()) { }

    public bind(id: number, type: SemanticType): TypeEnvironment {
        return new TypeEnvironment(new Map([...this.bindings, [id, type]]));
    }

    public resolve(variable: number): SemanticType | undefined {
        return this.bindings.get(variable);
    }
}

export interface VariableState {
    readonly lowerBounds: Set<SemanticType>;
    readonly upperBounds: Set<SemanticType>;
}
