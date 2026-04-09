package com.netserve.auth.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.UserDeletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUserDeleted(UserDeletedEvent event) {
        log.info("Publishing UserDeletedEvent for userId: {}", event.getUserId());
        kafkaTemplate.send(EventTopics.USER_DELETED, String.valueOf(event.getUserId()), event);
    }
}
