package com.netserve.subscription.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.SubscriptionActivatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishSubscriptionActivated(SubscriptionActivatedEvent event) {
        event.setEventType("SUBSCRIPTION_ACTIVATED");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.SUBSCRIPTION_ACTIVATED, event.getSubscriptionId().toString(), event);
        log.info("Published SubscriptionActivatedEvent for subscriptionId={}", event.getSubscriptionId());
    }
}
