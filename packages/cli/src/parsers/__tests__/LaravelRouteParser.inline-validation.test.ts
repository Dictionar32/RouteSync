import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { LaravelRouteParser } from '../LaravelRouteParser'

const fixtureRoots: string[] = []

afterEach(async () => {
    await Promise.all(fixtureRoots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

/** A controller using Laravel's inline `$request->validate()` API. */
async function createInlineValidationFixture(): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), 'routesync-inline-validation-'))
    fixtureRoots.push(root)

    await Promise.all([
        mkdir(path.join(root, 'routes'), { recursive: true }),
        mkdir(path.join(root, 'vendor'), { recursive: true }),
        mkdir(path.join(root, 'bootstrap'), { recursive: true }),
        mkdir(path.join(root, 'app', 'Http', 'Controllers'), { recursive: true }),
    ])

    await writeFile(path.join(root, 'routes', 'api.php'), '<?php\n')
    await writeFile(
        path.join(root, 'vendor', 'autoload.php'),
        `<?php
function class_basename($class) { return basename(str_replace('\\\\', '/', $class)); }
function app($key) { return new FakeRouter(); }
function app_path($path = '') { return __DIR__ . '/../app' . ($path ? '/' . $path : ''); }
class FakeRequest {}
class_alias(FakeRequest::class, 'Illuminate\\\\Http\\\\Request');
class FakeApp { public function make($class) { return new FakeKernel(); } }
class FakeKernel { public function bootstrap() {} }
class FakeRouter { public function getRoutes() { return [new FakeRoute()]; } }
class FakeRoute {
    public function uri() { return 'api/profile/avatar'; }
    public function methods() { return ['POST']; }
    public function gatherMiddleware() { return []; }
    public function getAction() { return ['uses' => 'App\\\\Http\\\\Controllers\\\\AvatarController@store']; }
    public function getName() { return 'profile.avatar.store'; }
}
spl_autoload_register(function ($class) {
    if ($class === 'App\\\\Http\\\\Controllers\\\\AvatarController') {
        require __DIR__ . '/../app/Http/Controllers/AvatarController.php';
    }
});
`
    )
    await writeFile(path.join(root, 'bootstrap', 'app.php'), '<?php\nreturn new FakeApp();\n')
    await writeFile(
        path.join(root, 'app', 'Http', 'Controllers', 'AvatarController.php'),
        `<?php
namespace App\\Http\\Controllers;

class AvatarController
{
    public function store(\\Illuminate\\Http\\Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,png', 'max:2048'],
        ]);

        return response()->json(['uploaded' => true]);
    }
}
`
    )

    return path.join(root, 'routes', 'api.php')
}

describe('LaravelRouteParser — inline request validation', () => {
    test('[capability target] extracts $request->validate() rules into the manifest', async () => {
        const routesFile = await createInlineValidationFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)

        expect(routes).toHaveLength(1)
        expect(routes[0].schema).toEqual({
            rules: {
                avatar: ['required', 'image', 'mimes:jpg,png', 'max:2048'],
            },
        })
    })
})
