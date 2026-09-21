<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/oauth/{provider}/redirect', [AuthController::class, 'oauthRedirect']);
Route::match(['get', 'post'], '/oauth/{provider}/callback', [AuthController::class, 'oauthCallback']);
Route::post('/social/login', [AuthController::class, 'socialLogin']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/produk', [ProdukController::class, 'index']);
Route::get('/produk/{id}', [ProdukController::class, 'show']);
Route::get('/produk/{id}/reviews', [ProductReviewController::class, 'index']);
Route::post('/payment/webhook', [PaymentController::class, 'webhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile', [ProfileController::class, 'update']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    Route::post('/cart/items', [OrderController::class, 'addItem']);
    Route::patch('/cart/items/{produkItemId}', [OrderController::class, 'updateItem']);
    Route::delete('/cart/items/{produkItemId}', [OrderController::class, 'removeItem']);
    Route::delete('/cart', [OrderController::class, 'clearCart']);
    Route::post('/cart/promo', [PromoController::class, 'apply']);
    Route::delete('/cart/promo', [PromoController::class, 'remove']);

    Route::post('/checkout', [OrderController::class, 'store']);
    Route::post('/buy-now', [OrderController::class, 'buyNow']);
    Route::get('/keranjang', [OrderController::class, 'keranjang']); // backward compatibility

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{produkItemId}', [WishlistController::class, 'destroy']);

    Route::post('/produk/{id}/reviews', [ProductReviewController::class, 'store']);

    Route::post('/payment/{orderId}', [PaymentController::class, 'store']);
    Route::get('/orders/{id}/invoice', [InvoiceController::class, 'download']);

    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/admin/produk', [ProdukController::class, 'store']);
});
