<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Domain: Order monetary values
     * Responsibility: Store all monetary amounts in minor units (cents)
     * Relation: 1:1 with orders table
     */
    public function up(): void
    {
        Schema::create('order_amounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id')->unique();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete();
            
            // Monetary values in minor units (cents)
            $table->bigInteger('subtotal_minor')->unsigned()->default(0);
            $table->bigInteger('shipping_minor')->unsigned()->default(0);
            $table->bigInteger('discount_minor')->unsigned()->default(0);
            $table->bigInteger('tax_minor')->unsigned()->default(0);
            $table->bigInteger('total_minor')->unsigned()->default(0);
            
            $table->timestamps();
            
            // Indexes for faster lookups
            $table->index('order_id', 'idx_order_amounts_order_id');
            $table->index('created_at', 'idx_order_amounts_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_amounts');
    }
};
