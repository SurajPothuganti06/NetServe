package com.netserve.support.kafka;

import com.netserve.common.event.CustomerDeletedEvent;
import com.netserve.common.event.EventTopics;
import com.netserve.support.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerDeletedEventConsumer {

    private final TicketService ticketService;

    @KafkaListener(topics = EventTopics.CUSTOMER_DELETED, groupId = "support-service-group")
    public void handleCustomerDeletedEvent(CustomerDeletedEvent event) {
        log.info("Received CustomerDeletedEvent for customerId={}", event.getCustomerId());
        try {
            ticketService.deleteTicketsByCustomerId(event.getCustomerId());
        } catch (Exception e) {
            log.error("Failed to delete tickets for customerId={}: {}", event.getCustomerId(), e.getMessage());
        }
    }
}
