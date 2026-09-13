/**
 * clientEmitters.ts
 *
 * Client artifact emitters for barrels, SDK, hooks, queries, actions, models, and routes.
 *
 * @module generators/bridge/clientEmitters
 */

import path from 'path'
import type { CompilerEmitter } from './bridgeTypes'
import { TypeGenerator } from '../TypeGenerator'
import { SDKGenerator } from '../SDKGenerator'
import { QueryKeyGenerator } from '../QueryKeyGenerator'
import { ConstantsGenerator } from '../ConstantsGenerator'
import { HookGenerator } from '../HookGenerator'
import { NextActionGenerator } from '../NextActionGenerator'
import { MswGenerator } from '../MswGenerator'
import { EchoGenerator } from '../EchoGenerator'
import { ModelGenerator } from '../ModelGenerator'
import { RoutesGenerator } from '../RoutesGenerator'
import { IndexGenerator } from '../IndexGenerator'

export const TypeBarrelEmitter: CompilerEmitter = {
    name: 'TypeBarrelEmitter',
    async emit(context): Promise<readonly string[]> {
        await TypeGenerator.generate(context.manifest, context.outputDir)
        return [path.join(context.outputDir, 'types', 'index.ts')]
    }
}

export const SdkClientEmitter: CompilerEmitter = {
    name: 'SdkClientEmitter',
    async emit(context): Promise<readonly string[]> {
        await SDKGenerator.generate(context.manifest, context.outputDir, context.options)
        return [path.join(context.outputDir, 'api.ts')]
    }
}

export const ConstantsEmitter: CompilerEmitter = {
    name: 'ConstantsEmitter',
    async emit(context): Promise<readonly string[]> {
        await ConstantsGenerator.generate(context.manifest, context.outputDir)
        return [path.join(context.outputDir, 'constants.ts')]
    }
}

export const QueryKeyEmitter: CompilerEmitter = {
    name: 'QueryKeyEmitter',
    async emit(context): Promise<readonly string[]> {
        if (context.options.hooks === false) return []
        await QueryKeyGenerator.generate(context.manifest, context.outputDir, context.domainGraph)
        return [path.join(context.outputDir, 'query-key.ts')]
    }
}

export const HookEmitter: CompilerEmitter = {
    name: 'HookEmitter',
    async emit(context): Promise<readonly string[]> {
        if (context.options.hooks === false) return []
        await HookGenerator.generate(context.manifest, context.outputDir, context.domainGraph)
        return [
            path.join(context.outputDir, 'hooks.ts'),
            path.join(context.outputDir, 'routesync.runtime.ts')
        ]
    }
}

export const NextActionEmitter: CompilerEmitter = {
    name: 'NextActionEmitter',
    async emit(context): Promise<readonly string[]> {
        if (!context.options.nextActions) return []
        await NextActionGenerator.generate(context.manifest, context.outputDir)
        return [path.join(context.outputDir, 'actions.ts')]
    }
}

export const MswEmitter: CompilerEmitter = {
    name: 'MswEmitter',
    async emit(context): Promise<readonly string[]> {
        if (!context.options.msw) return []
        await MswGenerator.generate(context.manifest, context.outputDir)
        return [path.join(context.outputDir, 'mocks.ts')]
    }
}

export const EchoEmitter: CompilerEmitter = {
    name: 'EchoEmitter',
    async emit(context): Promise<readonly string[]> {
        if (!context.options.echo || !context.manifest.channels) return []
        await EchoGenerator.generate(context.manifest.channels, context.outputDir)
        return [path.join(context.outputDir, 'echo.ts')]
    }
}

export const ModelEmitter: CompilerEmitter = {
    name: 'ModelEmitter',
    async emit(context): Promise<readonly string[]> {
        if (!context.options.models || !context.manifest.models) return []
        await ModelGenerator.generate(context.manifest, context.outputDir)
        return [path.join(context.outputDir, 'core', 'models.ts')]
    }
}

export const RoutesEmitter: CompilerEmitter = {
    name: 'RoutesEmitter',
    async emit(context): Promise<readonly string[]> {
        if (!context.manifest.pages || typeof context.manifest.pages !== 'object') return []
        const generated = await RoutesGenerator.generate(context.manifest, context.outputDir)
        if (!generated) return []
        return [path.join(context.outputDir, 'routes.ts')]
    }
}

export const IndexEmitter: CompilerEmitter = {
    name: 'IndexEmitter',
    async emit(context): Promise<readonly string[]> {
        await IndexGenerator.generate(context.manifest, context.outputDir, context.options)
        return [path.join(context.outputDir, 'index.ts')]
    }
}

export const DEFAULT_CLIENT_EMITTERS: readonly CompilerEmitter[] = Object.freeze([
    TypeBarrelEmitter,
    SdkClientEmitter,
    ConstantsEmitter,
    QueryKeyEmitter,
    HookEmitter,
    NextActionEmitter,
    MswEmitter,
    EchoEmitter,
    ModelEmitter,
    RoutesEmitter,
    IndexEmitter
])
