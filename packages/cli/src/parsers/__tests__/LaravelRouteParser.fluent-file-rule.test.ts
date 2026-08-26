import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { LaravelRouteParser } from '../LaravelRouteParser'

const fixtureRoots: string[] = []

afterEach(async () => {
    await Promise.all(fixtureRoots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

/**
 * Uses the same protected state Laravel's `Illuminate\\Validation\\Rules\\File`
 * exposes through its fluent API. JSON serialization intentionally cannot see
 * that state, so this fixture proves the extractor must normalize rule objects.
 */
async function createFluentFileRuleFixture(): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), 'routesync-fluent-file-rule-'))
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
class FakeFluentFile {
    protected array $allowedMimetypes = [];
    protected array $allowedExtensions = [];
    protected ?int $maximumFileSize = null;
    protected bool $image = false;
    public static function image() { $rule = new self(); $rule->image = true; return $rule; }
    public static function file() { return new self(); }
    public function types(array $types) { $this->allowedMimetypes = $types; return $this; }
    public function max(string $size) {
        $this->maximumFileSize = $size === '2mb' ? 2000 : ($size === '1mb' ? 1000 : 0);
        return $this;
    }
}
class_alias(FakeFormRequest::class, 'Illuminate\\\\Foundation\\\\Http\\\\FormRequest');
class_alias(FakeFluentFile::class, 'Illuminate\\\\Validation\\\\Rules\\\\File');
class FakeApp { public function make($class) { return new FakeKernel(); } }
class FakeKernel { public function bootstrap() {} }
class FakeRouter { public function getRoutes() { return [new FakeRoute()]; } }
class FakeRoute {
    public function uri() { return 'api/uploads'; }
    public function methods() { return ['POST']; }
    public function gatherMiddleware() { return []; }
    public function getAction() { return ['uses' => 'App\\\\Http\\\\Controllers\\\\UploadController@store']; }
    public function getName() { return 'uploads.store'; }
}
spl_autoload_register(function ($class) {
    $files = [
        'App\\\\Http\\\\Controllers\\\\UploadController' => __DIR__ . '/../app/Http/Controllers/UploadController.php',
        'App\\\\Http\\\\Requests\\\\StoreUploadRequest' => __DIR__ . '/../app/Http/Requests/StoreUploadRequest.php',
    ];
    if (isset($files[$class])) require $files[$class];
});
`
    )
    await writeFile(path.join(root, 'bootstrap', 'app.php'), '<?php\nreturn new FakeApp();\n')
    await writeFile(
        path.join(root, 'app', 'Http', 'Controllers', 'UploadController.php'),
        `<?php
namespace App\\Http\\Controllers;

use App\\Http\\Requests\\StoreUploadRequest;

class UploadController
{
    public function store(StoreUploadRequest $request)
    {
        return response()->json(['uploaded' => true]);
    }
}
`
    )
    await writeFile(
        path.join(root, 'app', 'Http', 'Requests', 'StoreUploadRequest.php'),
        `<?php
namespace App\\Http\\Requests;

use Illuminate\\Validation\\Rules\\File;

class StoreUploadRequest extends \\Illuminate\\Foundation\\Http\\FormRequest
{
    public function rules(): array
    {
        return [
            'avatar' => ['required', File::image()->types(['jpg', 'png'])->max('2mb')],
            'document' => [File::file()->types(['application/pdf'])->max('1mb')],
        ];
    }
}
`
    )

    return path.join(root, 'routes', 'api.php')
}

describe('LaravelRouteParser — fluent Laravel file rules', () => {
    test('[capability target] normalizes File::image()->types()->max() into manifest rules', async () => {
        const routesFile = await createFluentFileRuleFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)

        expect(routes).toHaveLength(1)
        expect(routes[0].schema).toEqual({
            rules: {
                avatar: ['required', 'file', 'image', 'mimes:jpg,png', 'max:2000'],
                document: ['file', 'mimetypes:application/pdf', 'max:1000'],
            },
        })
    })
})
