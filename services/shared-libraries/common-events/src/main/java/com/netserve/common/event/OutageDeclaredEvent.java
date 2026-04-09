package com.netserve.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OutageDeclaredEvent extends BaseEvent {

    private Long outageId;
    private String title;
    private String affectedArea;
    private String severity;
    private LocalDateTime startTime;
    private LocalDateTime estimatedResolution;
}
