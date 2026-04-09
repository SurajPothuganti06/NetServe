package com.netserve.support.kafka;

import com.netserve.common.event.EventTopics;
import com.netserve.common.event.OutageDeclaredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SupportEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOutageDeclared(OutageDeclaredEvent event) {
        event.setEventType("OUTAGE_DECLARED");
        event.initDefaults();
        kafkaTemplate.send(EventTopics.OUTAGE_DECLARED, event.getOutageId().toString(), event);
        log.info("Published OutageDeclaredEvent for outageId={}, area={}",
                event.getOutageId(), event.getAffectedArea());
    }
}
