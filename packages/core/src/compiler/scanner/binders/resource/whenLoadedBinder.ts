import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import type { RelationName } from "../../../../types/upstream/names";
import { matchLookup, type Lookup } from "../../../../types/upstream/collections";
import { bindWhenLoadedResolution, resolveWhenLoadedRelation } from "./whenLoadedSemanticBinder";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";
import { ResourceFieldExpressionFactory } from "../../../../types/route";

export function bindWhenLoadedField(
    key: string,
    relationName: RelationName,
    modelSymbol: OriginModelSymbol,
): BoundResourceFieldResult {
    const resolution = resolveWhenLoadedRelation(modelSymbol, relationName);
    return bindWhenLoadedResolution(key, resolution);
}

