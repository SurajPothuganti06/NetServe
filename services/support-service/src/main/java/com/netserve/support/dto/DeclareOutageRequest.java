package com.netserve.support.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeclareOutageRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Affected area is required")
    private String affectedArea;

    private String severity = "MEDIUM";

    private LocalDateTime startTime;

    private LocalDateTime estimatedResolution;
}
