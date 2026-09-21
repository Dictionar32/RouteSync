<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$modelsPath = app_path('Models');
$files = \Illuminate\Support\Facades\File::allFiles($modelsPath);
$extracted = [];
foreach ($files as $file) {
    $class = 'App\\Models\\' . str_replace('/', '\\', $file->getRelativePathname());
    $class = preg_replace('/\.php$/', '', $class);
    
    if (class_exists($class) && is_subclass_of($class, 'Illuminate\Database\Eloquent\Model')) {
        try {
            $reflection = new ReflectionClass($class);
            if ($reflection->isAbstract()) continue;
            
            $model = new $class();
            $table = $model->getTable();
            $columns = \Illuminate\Support\Facades\Schema::getColumns($table);
            
            $extracted[] = class_basename($class);
        } catch (\Exception $e) {
            echo "Error on $class: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Not a model or not found: $class\n";
    }
}
echo "Models found: " . count($extracted) . "\n";
