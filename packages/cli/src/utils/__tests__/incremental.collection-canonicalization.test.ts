import path from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, test } from 'vitest'
import {
    resolveManifestIncrementally,
    type ScannedManifest,
} from '../incremental'

const noPreviousManifest = path.join(tmpdir(), 'routesync-no-previous-manifest.json')

/**
 * The semantic kernel output produced for `OrderDetailResource::collection()`.
 * The test stays at the incremental boundary so it verifies what is actually
 * serialized into the manifest, rather than only what a later generator can
 * infer from a legacy collection flag.
 */
const resourceCollectionKernel = {
    resolve(field: { kind?: string }) {
        if (field.kind === 'static_method_call') {
            return {
                status: 'resolved',
                type: 'resource',
                resource: 'OrderDetailResource',
                collection: true,
                confidence: 100,
                trace: [],
            }
        }

        return { status: 'unknown' }
    },
}

function legacyCollectionManifest(): ScannedManifest {
    return {
        routes: [{
            name: 'products.index',
            method: 'GET',
            path: '/products',
            auth: false,
            response: {
                kind: 'resource',
                resource: 'ProdukItemResource',
                model: 'ProdukItem',
                collection: true,
            },
        }],
        resources: [{
            name: 'OrderResource',
            fields: {
                items: {
                    kind: 'static_method_call',
                    originalCode: 'OrderDetailResource::collection($this->details)',
                    className: 'OrderDetailResource',
                    name: 'collection',
                    args: [],
                },
            },
        }],
    }
}

describe('resolveManifestIncrementally — canonical collection descriptors', () => {
    test('CAPABILITY TARGET: migrates a top-level resource collection to array → element', () => {
        const { manifest } = resolveManifestIncrementally(
            legacyCollectionManifest(),
            noPreviousManifest,
            resourceCollectionKernel,
            [],
        )

        expect(manifest.routes?.[0].response).toMatchObject({
            kind: 'array',
            element: {
                kind: 'resource',
                resource: 'ProdukItemResource',
                collection: false,
            },
        })
    })

    test('CAPABILITY TARGET: migrates Resource::collection() fields to array → element', () => {
        const { manifest } = resolveManifestIncrementally(
            legacyCollectionManifest(),
            noPreviousManifest,
            resourceCollectionKernel,
            [],
        )

        expect(manifest.resources?.[0].fields?.items).toMatchObject({
            kind: 'array',
            element: {
                kind: 'resource',
                resource: 'OrderDetailResource',
                collection: false,
            },
        })
    })
})
