package com.netserve.support.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutageResponse {

    private Long id;
    private String title;
    private String description;
    private String affectedArea;
    private String severity;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime estimatedResolution;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
