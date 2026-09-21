<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Domain: Order fulfillment/shipping tracking
     * Responsibility: Track fulfillment status, shipping dates, and cancellation
     * Relation: 1:1 with orders table
     */
    public function up(): void
    {
        Schema::create('order_fulfillments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id')->unique();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete();
            
            // Fulfillment status tracking
            $table->enum('fulfillment_status', [
                'unfulfilled',
                'processing',
                'shipped',
                'completed',
                'cancelled',
                'returned'
            ])->default('unfulfilled');
            
            // Fulfillment timestamps
            $table->timestamp('processing_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            
            // Cancellation reason
            $table->text('cancel_reason')->nullable();
            
            $table->timestamps();
            
            // Indexes for faster lookups
            $table->index('order_id', 'idx_order_fulfillments_order_id');
            $table->index('fulfillment_status', 'idx_order_fulfillments_status');
            $table->index('created_at', 'idx_order_fulfillments_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_fulfillments');
    }
};
