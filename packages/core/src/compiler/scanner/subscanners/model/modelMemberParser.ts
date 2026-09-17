/**
 * modelMemberParser.ts
 *
 * Orchestrator that coordinates parsing AST tokens of a Laravel Eloquent model file
 * for properties, casts, accessors, and relations.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module core/compiler/scanner/subscanners/model
 */

import type {
    ParsedCast,
    ParsedAccessor,
    ParsedRelation
} from "../../../../types/route";
import type { TokenDescriptor } from "../../LaravelSourceLexer";
import {
    type ModelPropertiesState,
    tryParseModelProperty
} from "./memberPropertiesParser";
import { tryParseModelCasts } from "./memberCastsParser";
import { tryParseModelAccessors } from "./memberAccessorsParser";
import { tryParseModelRelations } from "./memberRelationsParser";

export interface ParsedModelMembers {
    readonly table: string;
    readonly primaryKey: string;
    readonly keyType: import("../../../../types/domain/eloquentTypes").ModelKeyType;
    readonly incrementing: boolean;
    readonly fillable: readonly string[];
    readonly guarded: readonly string[];
    readonly hidden: readonly string[];
    readonly appends: readonly string[];
    readonly casts: readonly ParsedCast[];
    readonly accessors: readonly ParsedAccessor[];
    readonly relations: readonly ParsedRelation[];
}

/**
 * Parses model members (table, keys, fillables, casts, accessors, and relations) from token stream.
 */
export function parseModelMembers(
    source: string,
    tokens: readonly TokenDescriptor[],
    defaultTable: string
): ParsedModelMembers {
    const propState: ModelPropertiesState = {
        table: defaultTable,
        primaryKey: 'id',
        keyType: import("../../../../types/domain/eloquentTypes").ModelKeyType.Int,
        incrementing: true,
        fillable: [],
        guarded: ['*'],
        hidden: [],
        appends: []
    };

    const casts: ParsedCast[] = [];
    const accessors: ParsedAccessor[] = [];
    const relations: ParsedRelation[] = [];

    for (let i = 0; i < tokens.length; i++) {
        tryParseModelProperty(source, tokens, i, propState);
        tryParseModelCasts(source, tokens, i, casts);
        tryParseModelAccessors(tokens, i, accessors);
        tryParseModelRelations(tokens, i, relations);
    }

    return {
        table: propState.table,
        primaryKey: propState.primaryKey,
        keyType: propState.keyType,
        incrementing: propState.incrementing,
        fillable: propState.fillable,
        guarded: propState.guarded,
        hidden: propState.hidden,
        appends: propState.appends,
        casts,
        accessors,
        relations
    };
}
