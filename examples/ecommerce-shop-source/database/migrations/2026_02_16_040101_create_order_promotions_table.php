<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('promo_code_id')->nullable()->constrained('promo_codes')->nullOnDelete();
            $table->string('promo_code', 64);
            $table->unsignedBigInteger('discount_minor')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique('order_id', 'uq_order_promotion_order');
            $table->index(['promo_code_id', 'created_at'], 'idx_order_promo_code_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_promotions');
    }
};
