package com.netserve.customer.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.UserDeletedEvent;
import com.netserve.customer.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDeletedEventConsumer {

    private final CustomerService customerService;

    @KafkaListener(topics = EventTopics.USER_DELETED, groupId = "customer-service-group")
    public void handleUserDeletedEvent(UserDeletedEvent event) {
        log.info("Received UserDeletedEvent for userId={}", event.getUserId());
        try {
            customerService.deleteCustomerByUserId(event.getUserId());
        } catch (Exception e) {
            log.error("Failed to delete customer for userId={}: {}", event.getUserId(), e.getMessage());
        }
    }
}
