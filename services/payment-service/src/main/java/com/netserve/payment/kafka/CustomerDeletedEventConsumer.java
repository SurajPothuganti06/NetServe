package com.netserve.payment.kafka;

import com.netserve.common.event.CustomerDeletedEvent;
import com.netserve.common.event.EventTopics;
import com.netserve.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerDeletedEventConsumer {

    private final PaymentService paymentService;

    @KafkaListener(topics = EventTopics.CUSTOMER_DELETED, groupId = "payment-service-group")
    public void handleCustomerDeletedEvent(CustomerDeletedEvent event) {
        log.info("Received CustomerDeletedEvent for customerId={}", event.getCustomerId());
        try {
            paymentService.deletePaymentsByCustomerId(event.getCustomerId());
        } catch (Exception e) {
            log.error("Failed to delete payments for customerId={}: {}", event.getCustomerId(), e.getMessage());
        }
    }
}
