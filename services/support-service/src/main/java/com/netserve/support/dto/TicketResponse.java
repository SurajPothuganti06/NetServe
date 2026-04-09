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
public class TicketResponse {

    private Long id;
    private Long customerId;
    private String subject;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String assignedTo;
    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
