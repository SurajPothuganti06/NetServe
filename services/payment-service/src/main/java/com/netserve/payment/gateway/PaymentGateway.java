package com.netserve.payment.gateway;

import com.netserve.payment.entity.Payment;

/**
 * Abstraction for payment processing.
 * Implementations are selected by Spring profile (dev vs prod).
 */
public interface PaymentGateway {

    /**
     * Process a payment and return a transaction reference.
     */
    String processPayment(Payment payment);

    /**
     * Refund a payment by its transaction reference.
     */
    void refundPayment(String transactionRef);
}
