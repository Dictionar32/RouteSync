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
 * Builds the smallest executable Laravel-shaped project needed by the PHP
 * extractor. Keeping this fixture self-contained makes scanner regressions
 * reproducible without a real database or an external Laravel checkout.
 */
async function createArrayResponseFixture(): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), 'routesync-array-response-'))
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
class FakeApp { public function make($class) { return new FakeKernel(); } }
class FakeKernel { public function bootstrap() {} }
class FakeRouter {
    public function getRoutes() {
        return [new ArrayResponseRoute(), new CategoryResponseRoute(), new ReviewResponseRoute()];
    }
}
class ArrayResponseRoute {
    public function uri() { return 'api/array-response'; }
    public function methods() { return ['GET', 'HEAD']; }
    public function gatherMiddleware() { return []; }
    public function getAction() { return ['uses' => 'App\\\\Http\\\\Controllers\\\\ArrayResponseController@index']; }
    public function getName() { return 'array-response.index'; }
}
class CategoryResponseRoute {
    public function uri() { return 'api/categories'; }
    public function methods() { return ['GET', 'HEAD']; }
    public function gatherMiddleware() { return []; }
    public function getAction() { return ['uses' => 'App\\\\Http\\\\Controllers\\\\CategoryResponseController@index']; }
    public function getName() { return 'categories.index'; }
}
class ReviewResponseRoute {
    public function uri() { return 'api/produk/{id}/reviews'; }
    public function methods() { return ['GET', 'HEAD']; }
    public function gatherMiddleware() { return []; }
    public function getAction() { return ['uses' => 'App\\\\Http\\\\Controllers\\\\ReviewResponseController@index']; }
    public function getName() { return 'produk.reviews.index'; }
}
spl_autoload_register(function ($class) {
    $files = [
        'App\\\\Http\\\\Controllers\\\\ArrayResponseController' => __DIR__ . '/../app/Http/Controllers/ArrayResponseController.php',
        'App\\\\Http\\\\Controllers\\\\CategoryResponseController' => __DIR__ . '/../app/Http/Controllers/CategoryResponseController.php',
        'App\\\\Http\\\\Controllers\\\\ReviewResponseController' => __DIR__ . '/../app/Http/Controllers/ReviewResponseController.php',
    ];
    if (isset($files[$class])) require $files[$class];
});
`
    )
    await writeFile(
        path.join(root, 'bootstrap', 'app.php'),
        '<?php\nreturn new FakeApp();\n'
    )
    await writeFile(
        path.join(root, 'app', 'Http', 'Controllers', 'ArrayResponseController.php'),
        `<?php
namespace App\\Http\\Controllers;

class ArrayResponseController
{
    public function index()
    {
        return response()->json([
            'roles' => ['admin', 'editor'],
            'products' => [
                ['id' => 1, 'name' => 'Keyboard'],
            ],
        ]);
    }
}
`
    )
    await writeFile(
        path.join(root, 'app', 'Http', 'Controllers', 'CategoryResponseController.php'),
        `<?php
namespace App\\Http\\Controllers;

class CategoryResponseController
{
    public function index()
    {
        $categories = Category::orderBy('nama')->get(['id', 'nama']);

        return response()->json(['data' => $categories]);
    }
}
`
    )
    await writeFile(
        path.join(root, 'app', 'Http', 'Controllers', 'ReviewResponseController.php'),
        `<?php
namespace App\\Http\\Controllers;

class ReviewResponseController
{
    public function index()
    {
        $reviews = ProductReview::where('produk_item_id', 1)->latest()->paginate(10);

        return response()->json(['reviews' => $reviews]);
    }
}
`
    )

    return path.join(root, 'routes', 'api.php')
}

describe('LaravelRouteParser — inline response arrays', () => {
    test('emits recursive array field kinds for primitive and object lists', async () => {
        const routesFile = await createArrayResponseFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)

        expect(routes).toHaveLength(3)
        expect(routes.find(route => route.path === '/array-response')?.response).toMatchObject({
            kind: 'object',
            fields: {
                roles: {
                    kind: 'array',
                    element: { kind: 'primitive', type: 'string' },
                },
                products: {
                    kind: 'array',
                    element: {
                        kind: 'object',
                        fields: {
                            id: { kind: 'primitive', type: 'number' },
                            name: { kind: 'primitive', type: 'string' },
                        },
                    },
                },
            },
        })
    })

    test('preserves Eloquent get() collections and paginator data inside inline JSON responses', async () => {
        const routesFile = await createArrayResponseFixture()
        const { routes } = await new LaravelRouteParser().parse(routesFile)

        expect(routes.find(route => route.path === '/categories')?.response).toMatchObject({
            kind: 'object',
            fields: {
                data: {
                    kind: 'array',
                    element: { kind: 'model', model: 'Category', collection: false },
                },
            },
        })
        expect(routes.find(route => route.path === '/produk/{id}/reviews')?.response).toMatchObject({
            kind: 'object',
            fields: {
                reviews: {
                    kind: 'object',
                    paginated: true,
                    fields: {
                        data: {
                            kind: 'array',
                            element: { kind: 'model', model: 'ProductReview', collection: false },
                        },
                    },
                },
            },
        })
    })
})
