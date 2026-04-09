package com.netserve.payment.gateway;

import com.netserve.payment.entity.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Simulated payment gateway for development and testing.
 * Always succeeds and generates a fake transaction reference.
 */
@Component
@Profile("dev")
@Slf4j
public class SimulatedPaymentGateway implements PaymentGateway {

    @Override
    public String processPayment(Payment payment) {
        log.info("[SIMULATED] Processing payment: amount={}, method={}",
                payment.getAmount(), payment.getPaymentMethod());
        // Simulate a small delay
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String ref = "SIM_" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        log.info("[SIMULATED] Payment approved: ref={}", ref);
        return ref;
    }

    @Override
    public void refundPayment(String transactionRef) {
        log.info("[SIMULATED] Refund processed for ref={}", transactionRef);
    }
}
