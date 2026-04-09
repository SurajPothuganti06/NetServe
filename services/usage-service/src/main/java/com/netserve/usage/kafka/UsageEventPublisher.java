package com.netserve.usage.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.UsageThresholdExceededEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UsageEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUsageThresholdExceeded(UsageThresholdExceededEvent event) {
        event.setEventType("USAGE_THRESHOLD_EXCEEDED");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.USAGE_THRESHOLD_EXCEEDED, event.getCustomerId().toString(), event);
        log.info("Published UsageThresholdExceededEvent for customerId={}, {}% used",
                event.getCustomerId(), event.getPercentUsed());
    }
}
