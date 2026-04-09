package com.netserve.notification.kafka;

import com.netserve.common.event.CustomerDeletedEvent;
import com.netserve.common.event.EventTopics;
import com.netserve.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerDeletedEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = EventTopics.CUSTOMER_DELETED, groupId = "notification-service-group")
    public void handleCustomerDeletedEvent(CustomerDeletedEvent event) {
        log.info("Received CustomerDeletedEvent for customerId={}", event.getCustomerId());
        try {
            notificationService.deleteNotificationsByCustomerId(event.getCustomerId());
        } catch (Exception e) {
            log.error("Failed to delete notifications for customerId={}: {}", event.getCustomerId(), e.getMessage());
        }
    }
}
