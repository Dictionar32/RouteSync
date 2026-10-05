<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->get('/orders/{order}', [OrderController::class, 'update']);
