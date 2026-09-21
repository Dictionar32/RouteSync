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
        Schema::create('produk_item_frontends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produk_item_id')
                ->unique()
                ->constrained('produk_items')
                ->cascadeOnDelete();
            $table->string('gambar')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('jumlah_review')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produk_item_frontends');
    }
};
