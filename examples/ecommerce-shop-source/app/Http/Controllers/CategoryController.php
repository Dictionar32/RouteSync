<?php

namespace App\Http\Controllers;

use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::orderBy('nama')->get(['id', 'nama']);

        return response()->json([
            'data' => $categories,
        ]);
    }
}
