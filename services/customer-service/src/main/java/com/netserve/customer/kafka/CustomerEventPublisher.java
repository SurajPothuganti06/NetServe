package com.netserve.customer.kafka;

import com.netserve.common.event.CustomerCreatedEvent;
import com.netserve.common.event.CustomerStatusChangedEvent;
import com.netserve.common.event.EventTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishCustomerCreated(CustomerCreatedEvent event) {
        event.setEventType("CUSTOMER_CREATED");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.CUSTOMER_CREATED, event.getCustomerId().toString(), event);
        log.info("Published CustomerCreatedEvent for customerId={}", event.getCustomerId());
    }

    public void publishCustomerStatusChanged(CustomerStatusChangedEvent event) {
        event.setEventType("CUSTOMER_STATUS_CHANGED");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.CUSTOMER_STATUS_CHANGED, event.getCustomerId().toString(), event);
        log.info("Published CustomerStatusChangedEvent for customerId={}", event.getCustomerId());
    }

    public void publishCustomerDeleted(com.netserve.common.event.CustomerDeletedEvent event) {
        event.setEventType("CUSTOMER_DELETED");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.CUSTOMER_DELETED, event.getCustomerId().toString(), event);
        log.info("Published CustomerDeletedEvent for customerId={}", event.getCustomerId());
    }
}
