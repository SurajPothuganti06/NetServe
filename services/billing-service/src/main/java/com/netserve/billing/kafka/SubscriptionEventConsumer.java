package com.netserve.billing.kafka;

import com.netserve.billing.service.InvoiceService;
import com.netserve.common.event.EventTopics;
import com.netserve.common.event.SubscriptionActivatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionEventConsumer {

    private final InvoiceService invoiceService;

    @KafkaListener(
            topics = EventTopics.SUBSCRIPTION_ACTIVATED,
            groupId = "billing-service"
    )
    public void onSubscriptionActivated(SubscriptionActivatedEvent event) {
        log.info("Received SubscriptionActivatedEvent: subscriptionId={}, customerId={}",
                event.getSubscriptionId(), event.getCustomerId());

        try {
            invoiceService.generateFromSubscription(
                    event.getCustomerId(),
                    event.getSubscriptionId(),
                    event.getPlanName(),
                    event.getMonthlyPrice(),
                    event.getBillingCycle()
            );
            log.info("Invoice auto-generated for subscriptionId={}", event.getSubscriptionId());
        } catch (Exception e) {
            log.error("Failed to generate invoice for subscriptionId={}: {}",
                    event.getSubscriptionId(), e.getMessage(), e);
        }
    }
}
