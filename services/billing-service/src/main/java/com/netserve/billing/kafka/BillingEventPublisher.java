package com.netserve.billing.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.InvoiceGeneratedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BillingEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishInvoiceGenerated(InvoiceGeneratedEvent event) {
        event.setEventType("INVOICE_GENERATED");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.INVOICE_GENERATED, event.getInvoiceId().toString(), event);
        log.info("Published InvoiceGeneratedEvent for invoiceId={}", event.getInvoiceId());
    }
}
