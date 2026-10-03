/**
 * defaultPlugins.ts
 *
 * Default resolver plugin pipeline for SemanticResolutionKernel.
 *
 * @module core/semantic/kernel
 */

import type { ResolverPlugin } from '../types';
import { PrimitiveResolver } from '../plugins/PrimitiveResolver';
import { ModelColumnResolver } from '../plugins/ModelColumnResolver';
import { AccessorResolver } from '../plugins/AccessorResolver';
import { ResourceGraphResolver } from '../plugins/ResourceGraphResolver';
import { ConditionalWrapperResolver } from '../plugins/ConditionalWrapperResolver';
import { FrameworkRegistryResolver } from '../plugins/FrameworkRegistryResolver';
import { EloquentMethodResolver } from '../plugins/EloquentMethodResolver';
import { ExpressionResolver } from '../plugins/ExpressionResolver';
import { VariableResolver } from '../plugins/VariableResolver';

export function createDefaultPlugins(): readonly ResolverPlugin[] {
    return Object.freeze([
        PrimitiveResolver,
        ModelColumnResolver,
        AccessorResolver,
        ResourceGraphResolver,
        ConditionalWrapperResolver,
        FrameworkRegistryResolver,
        EloquentMethodResolver,
        ExpressionResolver,
        VariableResolver,
    ]);
}
