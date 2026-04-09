package com.netserve.payment.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.PaymentSuccessfulEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishPaymentSuccessful(PaymentSuccessfulEvent event) {
        event.setEventType("PAYMENT_SUCCESSFUL");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.PAYMENT_SUCCESSFUL, event.getPaymentId().toString(), event);
        log.info("Published PaymentSuccessfulEvent for paymentId={}, invoiceId={}",
                event.getPaymentId(), event.getInvoiceId());
    }
}
