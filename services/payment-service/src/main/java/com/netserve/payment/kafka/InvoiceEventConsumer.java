package com.netserve.payment.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.InvoiceGeneratedEvent;
import com.netserve.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceEventConsumer {

    private final PaymentService paymentService;

    @KafkaListener(
            topics = EventTopics.INVOICE_GENERATED,
            groupId = "payment-service"
    )
    public void onInvoiceGenerated(InvoiceGeneratedEvent event) {
        log.info("Received InvoiceGeneratedEvent: invoiceId={}, customerId={}, amount={}",
                event.getInvoiceId(), event.getCustomerId(), event.getTotalAmount());

        try {
            paymentService.createPendingPayment(
                    event.getInvoiceId(),
                    event.getCustomerId(),
                    event.getTotalAmount()
            );
            log.info("Pending payment created for invoiceId={}", event.getInvoiceId());
        } catch (Exception e) {
            log.error("Failed to create pending payment for invoiceId={}: {}",
                    event.getInvoiceId(), e.getMessage(), e);
        }
    }
}
