package com.netserve.payment.gateway;

import com.netserve.payment.entity.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Production payment gateway using Razorpay.
 *
 * TODO: Replace the placeholder bodies with actual Razorpay SDK calls:
 *
 * RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
 * JSONObject options = new JSONObject();
 * options.put("amount", payment.getAmount().movePointRight(2).intValue());
 * options.put("currency", "INR");
 * Order order = razorpay.orders.create(options);
 * return order.get("id");
 */
@Component
@Profile("prod")
@Slf4j
public class RazorpayPaymentGateway implements PaymentGateway {

    @Value("${payment.razorpay.key-id:rzp_test_placeholder}")
    private String razorpayKeyId;

    @Value("${payment.razorpay.key-secret:rzp_secret_placeholder}")
    private String razorpayKeySecret;

    @Override
    public String processPayment(Payment payment) {
        log.info("Processing Razorpay payment: amount={}, method={}",
                payment.getAmount(), payment.getPaymentMethod());

        // TODO: Integrate real Razorpay SDK here
        // RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        // JSONObject options = new JSONObject();
        // options.put("amount", payment.getAmount().movePointRight(2).intValue());
        // options.put("currency", "INR");
        // options.put("receipt", "rcpt_" + payment.getId());
        // Order order = razorpay.orders.create(options);
        // return order.get("id");

        // Placeholder until Razorpay SDK is integrated
        String ref = "rzp_" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        log.warn("Razorpay SDK not yet integrated — using placeholder ref={}", ref);
        return ref;
    }

    @Override
    public void refundPayment(String transactionRef) {
        log.info("Processing Razorpay refund for ref={}", transactionRef);

        // TODO: Integrate real Razorpay refund
        // RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        // JSONObject refundRequest = new JSONObject();
        // refundRequest.put("speed", "normal");
        // razorpay.payments.refund(transactionRef, refundRequest);

        log.warn("Razorpay SDK not yet integrated — refund simulated for ref={}", transactionRef);
    }
}
