package com.netserve.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseEvent {

    private String eventId;
    private String eventType;
    private LocalDateTime occurredAt;

    public void initDefaults() {
        if (this.eventId == null)
            this.eventId = UUID.randomUUID().toString();
        if (this.occurredAt == null)
            this.occurredAt = LocalDateTime.now();
    }
}
