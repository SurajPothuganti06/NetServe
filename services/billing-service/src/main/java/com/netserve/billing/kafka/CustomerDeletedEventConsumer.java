package com.netserve.billing.kafka;

import com.netserve.common.event.CustomerDeletedEvent;
import com.netserve.common.event.EventTopics;
import com.netserve.billing.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerDeletedEventConsumer {

    private final InvoiceService invoiceService;

    @KafkaListener(topics = EventTopics.CUSTOMER_DELETED, groupId = "billing-service-group")
    public void handleCustomerDeletedEvent(CustomerDeletedEvent event) {
        log.info("Received CustomerDeletedEvent for customerId={}", event.getCustomerId());
        try {
            invoiceService.deleteInvoicesByCustomerId(event.getCustomerId());
        } catch (Exception e) {
            log.error("Failed to delete invoices for customerId={}: {}", event.getCustomerId(), e.getMessage());
        }
    }
}
