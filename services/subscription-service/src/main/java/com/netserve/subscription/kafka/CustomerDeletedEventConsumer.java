package com.netserve.subscription.kafka;

import com.netserve.common.event.CustomerDeletedEvent;
import com.netserve.common.event.EventTopics;
import com.netserve.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerDeletedEventConsumer {

    private final SubscriptionService subscriptionService;

    @KafkaListener(topics = EventTopics.CUSTOMER_DELETED, groupId = "subscription-service-group")
    public void handleCustomerDeletedEvent(CustomerDeletedEvent event) {
        log.info("Received CustomerDeletedEvent for customerId={}", event.getCustomerId());
        try {
            subscriptionService.deleteSubscriptionsByCustomerId(event.getCustomerId());
        } catch (Exception e) {
            log.error("Failed to delete subscriptions for customerId={}: {}", event.getCustomerId(), e.getMessage());
        }
    }
}
