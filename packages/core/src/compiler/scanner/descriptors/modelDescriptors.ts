/**
 * Model semantic construction entry points.
 *
 * Model meaning is represented by the upstream/domain ADT values themselves;
 * there is no ScannedModelDescriptor semantic owner here.
 */

import { buildModelSemanticDefinition } from './model/modelEntityDescriptor';
import {
    ScannedModelCastParams,
    ScannedModelCastDescriptor
} from './model/modelCastDescriptor';
import {
    ScannedModelRelationParams,
    ScannedModelRelationDescriptor
} from './model/modelRelationDescriptor';
import {
    ScannedModelColumnParams,
    ScannedModelColumnDescriptor
} from './model/modelColumnDescriptor';

export { buildModelSemanticDefinition };

export function createScannedColumn(params: Parameters<typeof ScannedModelColumnDescriptor.create>[0]): ScannedModelColumnDescriptor {
    return ScannedModelColumnDescriptor.create(params);
}
export function createScannedCast(params: Parameters<typeof ScannedModelCastDescriptor.create>[0]): ScannedModelCastDescriptor {
    return ScannedModelCastDescriptor.create(params);
}
export function createScannedRelation(params: Parameters<typeof ScannedModelRelationDescriptor.create>[0]): ScannedModelRelationDescriptor {
    return ScannedModelRelationDescriptor.create(params);
}

export {
    ScannedModelCastParams,
    ScannedModelCastDescriptor,
    ScannedModelRelationParams,
    ScannedModelRelationDescriptor,
    ScannedModelColumnParams,
    ScannedModelColumnDescriptor,
};
