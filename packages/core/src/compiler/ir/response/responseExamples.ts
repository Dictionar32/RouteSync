/**
 * responseExamples.ts
 *
 * Example factory helpers demonstrating ResponseArtifact construction.
 *
 * @module compiler/ir/response
 */

import { ResponseArtifact } from './ResponseArtifactClass';
import { ResponseArtifactBuilder } from './ResponseArtifactBuilder';

export function exampleResourceSingle(): ResponseArtifact {
    return new ResponseArtifactBuilder()
        .id('users.show.Response')
        .resource('UserResource', 'User', 'single', 1.0, 'Explicit UserResource return')
        .status(200)
        .contentType('application/json')
        .metadata({
            producer: 'ResponseAnalysisPass',
            dependencies: ['UserModel', 'UserResource'],
            revision: '1.0.0',
        })
        .build();
}

export function exampleCollectionLowConfidence(): ResponseArtifact {
    return new ResponseArtifactBuilder()
        .id('products.index.Response')
        .resource('ProductResource', 'Product', 'collection', 0.72, 'Variable-built collection')
        .status(200)
        .confidence({
            score: 0.72,
            reasons: [
                'Variable-built JSON response',
                'Dynamic array mutation detected',
                'Conditional resource wrapping'
            ],
            method: 'heuristic'
        })
        .metadata({
            producer: 'ResponseAnalysisPass',
            dependencies: ['ProductModel', 'ProductResource'],
            revision: '1.0.0',
        })
        .build();
}

export function exampleBinaryDownload(): ResponseArtifact {
    return new ResponseArtifactBuilder()
        .id('files.download.Response')
        .transport('binary')
        .contentType('application/pdf')
        .contentDisposition('attachment', 'document.pdf')
        .status(200)
        .confidence({
            score: 1.0,
            reasons: ['Explicit download() call'],
            method: 'explicit'
        })
        .metadata({
            producer: 'ResponseAnalysisPass',
            dependencies: [],
            revision: '1.0.0',
        })
        .build();
}
