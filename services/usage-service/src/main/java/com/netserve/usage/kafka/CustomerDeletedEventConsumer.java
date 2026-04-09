package com.netserve.usage.kafka;

import com.netserve.common.event.CustomerDeletedEvent;
import com.netserve.common.event.EventTopics;
import com.netserve.usage.service.UsageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerDeletedEventConsumer {

    private final UsageService usageService;

    @KafkaListener(topics = EventTopics.CUSTOMER_DELETED, groupId = "usage-service-group")
    public void handleCustomerDeletedEvent(CustomerDeletedEvent event) {
        log.info("Received CustomerDeletedEvent for customerId={}", event.getCustomerId());
        try {
            usageService.deleteUsageDataByCustomerId(event.getCustomerId());
        } catch (Exception e) {
            log.error("Failed to delete usage data for customerId={}: {}", event.getCustomerId(), e.getMessage());
        }
    }
}
