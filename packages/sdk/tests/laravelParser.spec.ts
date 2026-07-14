import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { LaravelRouteParser } from '../../cli/src/parsers/LaravelRouteParser'
import fs from 'fs-extra'
import path from 'path'

describe('LaravelRouteParser - Laravel Routes Scan Integration', () => {
  const tempDir = path.resolve(process.cwd(), 'temp-laravel-test')

  beforeAll(async () => {
    // Setup minimal Laravel directory structure
    await fs.ensureDir(path.join(tempDir, 'vendor'))
    await fs.ensureDir(path.join(tempDir, 'bootstrap'))
    await fs.ensureDir(path.join(tempDir, 'routes'))
    await fs.ensureDir(path.join(tempDir, 'app/Models'))

    // 1. Create empty autoload.php
    await fs.writeFile(path.join(tempDir, 'vendor/autoload.php'), '<?php\n')

    // 2. Create actual Eloquent Model files
    const productModelCode = `<?php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Casts\\Attribute;

class Product extends Model {
    public function category() {
        return $this->belongsTo(Category::class);
    }

    public function imageUrl() {
        return Attribute::make(
            get: fn() => 'http://image.url'
        );
    }
}
`
    const categoryModelCode = `<?php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Category extends Model {
}
`
    await fs.writeFile(path.join(tempDir, 'app/Models/Product.php'), productModelCode)
    await fs.writeFile(path.join(tempDir, 'app/Models/Category.php'), categoryModelCode)

    // 3. Create mock bootstrap/app.php containing mock router, routes, and controllers
    const mockAppCode = `<?php
// Mock Laravel core contracts and classes
namespace Illuminate\\Contracts\\Console {
    interface Kernel {
        public function bootstrap();
    }
}

namespace Illuminate\\Database\\Eloquent {
    class Model {
        public function getTable() {
            return strtolower(class_basename(get_class($this))) . 's';
        }
        public function getCasts() {
            return ['id' => 'int', 'price' => 'float'];
        }
        public function getHidden() {
            return ['password'];
        }
        public function belongsTo($related) {
            return $related;
        }
        public function getAppends() {
            return isset($this->appends) ? $this->appends : [];
        }
    }
}

namespace Illuminate\\Database\\Eloquent\\Casts {
    class Attribute {
        public static function make($get = null, $set = null) {
            return new self();
        }
    }
}

namespace Illuminate\\Foundation\\Http {
    class FormRequest {}
}

namespace Illuminate\\Support\\Facades {
    class File {
        public static function allFiles($path) {
            return [
                new class {
                    public function getRelativePathname() { return 'Product.php'; }
                    public function getRealPath() { return __DIR__ . '/../app/Models/Product.php'; }
                },
                new class {
                    public function getRelativePathname() { return 'Category.php'; }
                    public function getRealPath() { return __DIR__ . '/../app/Models/Category.php'; }
                }
            ];
        }
    }
    class Schema {
        public static function getColumns($table) {
            if ($table === 'products') {
                return [
                    ['name' => 'id', 'type' => 'bigint(20) unsigned', 'nullable' => false],
                    ['name' => 'name', 'type' => 'varchar(255)', 'nullable' => false],
                    ['name' => 'price', 'type' => 'decimal(12,2)', 'nullable' => false]
                ];
            }
            if ($table === 'categorys') { // plural of Category under simplified getTable()
                return [
                    ['name' => 'id', 'type' => 'bigint(20) unsigned', 'nullable' => false],
                    ['name' => 'title', 'type' => 'varchar(255)', 'nullable' => false]
                ];
            }
            return [];
        }
    }
}

namespace {
    if (!function_exists('class_basename')) {
        function class_basename($class) {
            $class = is_object($class) ? get_class($class) : $class;
            return basename(str_replace('\\\\', '/', $class));
        }
    }

    // Helper function app_path
    if (!function_exists('app_path')) {
        function app_path($path = '') {
            return __DIR__ . '/../app/' . $path;
        }
    }

    class MockRoute {
        private $method;
        private $uri;
        private $action;
        private $middleware;

        public function __construct($method, $uri, $action, $middleware) {
            $this->method = $method;
            $this->uri = $uri;
            $this->action = $action;
            $this->middleware = $middleware;
        }

        public function uri() { return $this->uri; }
        public function methods() { return [$this->method]; }
        public function gatherMiddleware() { return $this->middleware; }
        public function getAction() { return ['uses' => $this->action]; }
        public function getName() { return 'products.' . basename($this->uri); }
    }

    class MockRouter {
        public function getRoutes() {
            return [
                new MockRoute('GET', 'api/products', 'App\\\\Http\\\\Controllers\\\\ProductController@index', []),
                new MockRoute('POST', 'api/products', 'App\\\\Http\\\\Controllers\\\\ProductController@store', ['auth:sanctum'])
            ];
        }
    }

    class MockApp {
        public function make($class) {
            if ($class === 'router') return new MockRouter();
            if (str_contains($class, 'Kernel')) {
                return new class implements Illuminate\\Contracts\\Console\\Kernel {
                    public function bootstrap() {}
                };
            }
            return null;
        }
    }

    $app = new MockApp();

    if (!function_exists('app')) {
        function app($class) {
            global $app;
            return $app->make($class);
        }
    }
}

// Declare mock request & controller classes
namespace App\\Http\\Requests {
    class StoreProductRequest extends \\Illuminate\\Foundation\\Http\\FormRequest {
        public function rules() {
            return [
                'name' => 'required|string',
                'price' => 'required|numeric'
            ];
        }
    }
}

namespace App\\Http\\Controllers {
    class ProductController {
        public function index() {}
        public function store(\\App\\Http\\Requests\\StoreProductRequest $request) {}
    }
}

// Require the actual Model files so reflection finds them
namespace {
    // Helper to log errors in bootstrap loading
    try {
        require_once __DIR__ . '/../app/Models/Product.php';
        require_once __DIR__ . '/../app/Models/Category.php';
    } catch (\\Throwable $e) {
        file_put_contents(__DIR__ . '/../routesync-error.log', "Error on bootstrap load: " . $e->getMessage() . "\\n", FILE_APPEND);
    }
    return $app;
}
`
    await fs.writeFile(path.join(tempDir, 'bootstrap/app.php'), mockAppCode)

    // 4. Create dummy routes/api.php
    await fs.writeFile(path.join(tempDir, 'routes/api.php'), '<?php\n')
  })

  afterAll(async () => {
    // Cleanup temporary Laravel test directory
    await fs.remove(tempDir)
  })

  it('should successfully parse route configurations, request rules, Eloquent models, relations, and accessors', async () => {
    const parser = new LaravelRouteParser()
    const result = await parser.parse(path.join(tempDir, 'routes/api.php'), { extractModels: true })

    console.log('PARSED RESULT:', JSON.stringify(result, null, 2))

    // 1. Verify Routes
    expect(result.routes.length).toBe(2)

    const getRoute = result.routes.find(r => r.method === 'GET')
    expect(getRoute).toBeDefined()
    expect(getRoute?.path).toBe('/products')
    expect(getRoute?.auth).toBe(false)

    const postRoute = result.routes.find(r => r.method === 'POST')
    expect(postRoute).toBeDefined()
    expect(postRoute?.path).toBe('/products')
    expect(postRoute?.auth).toBe(true)
    
    // Verify FormRequest rules extraction
    expect(postRoute?.schema).toBeDefined()
    expect(postRoute?.schema?.rules?.name).toBe('required|string')
    expect(postRoute?.schema?.rules?.price).toBe('required|numeric')

    // 2. Verify Models
    expect(result.models.length).toBe(2)

    const productModel = result.models.find(m => m.name === 'Product')
    expect(productModel).toBeDefined()
    expect(productModel?.table).toBe('products')
    expect(productModel?.columns.length).toBe(3)
    
    // Verify casts and hidden
    expect(productModel?.casts?.price).toBe('float')
    
    // Verify relations parsing
    expect(productModel?.relations).toBeDefined()
    expect(productModel?.relations?.category).toBeDefined()
    expect(productModel?.relations?.category?.type).toBe('belongsTo')
    expect(productModel?.relations?.category?.model).toBe('Category')

    // Verify accessor parsing
    expect(productModel?.accessors).toBeDefined()
    expect(productModel?.accessors?.imageUrl).toBeDefined()
    expect(productModel?.accessors?.imageUrl?.expression).toBe("'http://image.url'")
  })
})
