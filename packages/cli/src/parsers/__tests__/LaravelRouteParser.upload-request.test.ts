import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { CompilationContext } from '../../../../core/src/compiler/passes/CompilationContext'
import { ContractGeneratorPass } from '../../../../core/src/compiler/passes/ContractGeneratorPass'
import { FormGeneratorPass } from '../../../../core/src/compiler/passes/FormGeneratorPass'
import { PrimitiveKind, PrimitiveType, ReadonlyCollectionType } from '../../../../core/src/compiler/types/SemanticType'
import type { RouteManifest } from '../../../../core/src/types/route'
import { manifestToContractInput, manifestToRequestTypes } from '../../generators/utils/manifest-to-types'
import { LaravelRouteParser } from '../LaravelRouteParser'

const fixtureRoots: string[] = []

afterEach(async () => {
    await Promise.all(fixtureRoots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

/**
 * Creates an executable Laravel-shaped project with a FormRequest upload rule.
 * This exercises the real PHP extractor rather than a hand-authored manifest.
 */
async function createUploadRequestFixture(): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), 'routesync-upload-request-'))
    fixtureRoots.push(root)

    await Promise.all([
        mkdir(path.join(root, 'routes'), { recursive: true }),
        mkdir(path.join(root, 'vendor'), { recursive: true }),
        mkdir(path.join(root, 'bootstrap'), { recursive: true }),
        mkdir(path.join(root, 'app', 'Http', 'Controllers'), { recursive: true }),
        mkdir(path.join(root, 'app', 'Http', 'Requests'), { recursive: true }),
    ])

    await writeFile(path.join(root, 'routes', 'api.php'), '<?php\n')
    await writeFile(
        path.join(root, 'vendor', 'autoload.php'),
        `<?php
function class_basename($class) { return basename(str_replace('\\\\', '/', $class)); }
function app($key) { return new FakeRouter(); }
function app_path($path = '') { return __DIR__ . '/../app' . ($path ? '/' . $path : ''); }
class FakeFormRequest {}
class_alias(FakeFormRequest::class, 'Illuminate\\\\Foundation\\\\Http\\\\FormRequest');
class FakeApp { public function make($class) { return new FakeKernel(); } }
class FakeKernel { public function bootstrap() {} }
class FakeRouter { public function getRoutes() { return [new FakeRoute()]; } }
class FakeRoute {
    public function uri() { return 'api/uploads'; }
    public function methods() { return ['POST']; }
    public function gatherMiddleware() { return []; }
    public function getAction() { return ['uses' => 'App\\\\Http\\\\Controllers\\\\AvatarUploadController@store']; }
    public function getName() { return 'uploads.store'; }
}
spl_autoload_register(function ($class) {
    $files = [
        'App\\\\Http\\\\Controllers\\\\AvatarUploadController' => __DIR__ . '/../app/Http/Controllers/AvatarUploadController.php',
        'App\\\\Http\\\\Requests\\\\StoreAvatarRequest' => __DIR__ . '/../app/Http/Requests/StoreAvatarRequest.php',
    ];
    if (isset($files[$class])) require $files[$class];
});
`
    )
    await writeFile(path.join(root, 'bootstrap', 'app.php'), '<?php\nreturn new FakeApp();\n')
    await writeFile(
        path.join(root, 'app', 'Http', 'Controllers', 'AvatarUploadController.php'),
        `<?php
namespace App\\Http\\Controllers;

use App\\Http\\Requests\\StoreAvatarRequest;

class AvatarUploadController
{
    public function store(StoreAvatarRequest $request)
    {
        return response()->json(['uploaded' => true]);
    }
}
`
    )
    await writeFile(
        path.join(root, 'app', 'Http', 'Requests', 'StoreAvatarRequest.php'),
        `<?php
namespace App\\Http\\Requests;

class StoreAvatarRequest extends \\Illuminate\\Foundation\\Http\\FormRequest
{
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,png,webp', 'max:2048'],
            'attachments' => ['required', 'array'],
            'attachments.*' => ['file', 'mimes:pdf', 'max:512'],
        ];
    }
}
`
    )

    return path.join(root, 'routes', 'api.php')
}

describe('LaravelRouteParser — upload FormRequest', () => {
    test('preserves Laravel upload rules in the scanned manifest', async () => {
        const routesFile = await createUploadRequestFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)

        expect(routes).toHaveLength(1)
        expect(routes[0].schema).toEqual({
            rules: {
                avatar: ['required', 'file', 'image', 'mimes:jpg,png,webp', 'max:2048'],
                attachments: ['required', 'array'],
                'attachments.*': ['file', 'mimes:pdf', 'max:512'],
            },
        })
    })

    test('lowers an upload field to File in generated form types', async () => {
        const routesFile = await createUploadRequestFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)
        const manifest: RouteManifest = {
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),
            routes,
        }

        const requestTypes = manifestToRequestTypes(manifest)
        const avatar = requestTypes.requestTypes[0]?.actions[0]?.fields.find(field => field.originalName === 'avatar')

        expect(avatar?.required).toBe(true)
        expect(avatar?.type).toBeInstanceOf(PrimitiveType)
        expect((avatar?.type as PrimitiveType).type).toBe(PrimitiveKind.FILE)

        const [generatedForm] = new FormGeneratorPass().run(
            [requestTypes],
            CompilationContext.default()
        )
        expect(generatedForm.code).toContain('avatar: File')
    })

    test('[capability target] lowers wildcard upload fields to File[]', async () => {
        const routesFile = await createUploadRequestFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)
        const requestTypes = manifestToRequestTypes({
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),
            routes,
        })
        const attachments = requestTypes.requestTypes[0]?.actions[0]?.fields
            .find(field => field.originalName === 'attachments')

        expect(attachments?.type).toBeInstanceOf(ReadonlyCollectionType)
        expect((attachments?.type as ReadonlyCollectionType).elementType).toMatchObject({
            kind: 'primitive',
            type: PrimitiveKind.FILE,
        })

        const [generatedForm] = new FormGeneratorPass().run(
            [requestTypes],
            CompilationContext.default()
        )
        expect(generatedForm.code).toContain('attachments: Array<File>')
    })

    test('[capability target] enforces image extensions and Laravel max kilobytes in the generated Zod contract', async () => {
        const routesFile = await createUploadRequestFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)
        const contractInput = manifestToContractInput({
            version: '1.0.0',
            baseURL: 'http://localhost',
            generatedAt: new Date().toISOString(),
            routes,
        })

        const [generatedContract] = new ContractGeneratorPass().run([contractInput])

        expect(generatedContract.code).toContain("file.type === 'image/jpeg'")
        expect(generatedContract.code).toContain("file.type === 'image/png'")
        expect(generatedContract.code).toContain("file.type === 'image/webp'")
        expect(generatedContract.code).toContain('file.size <= 2097152')
    })
})
