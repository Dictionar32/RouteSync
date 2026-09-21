<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Domain: Payment/Financial tracking
     * Responsibility: Track financial status, refunds, and payment-related information
     * Relation: 1:1 with orders table
     */
    public function up(): void
    {
        Schema::create('order_financials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id')->unique();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete();
            
            // Financial status tracking
            $table->enum('financial_status', [
                'pending',
                'paid',
                'partially_refunded',
                'refunded',
                'failed',
                'cancelled'
            ])->default('pending');
            
            // Refund information
            $table->timestamp('refunded_at')->nullable();
            $table->text('refund_reason')->nullable();
            
            $table->timestamps();
            
            // Indexes for faster lookups
            $table->index('order_id', 'idx_order_financials_order_id');
            $table->index('financial_status', 'idx_order_financials_status');
            $table->index('created_at', 'idx_order_financials_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_financials');
    }
};
