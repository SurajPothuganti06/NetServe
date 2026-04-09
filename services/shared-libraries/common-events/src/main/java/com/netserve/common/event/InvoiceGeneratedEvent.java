package com.netserve.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class InvoiceGeneratedEvent extends BaseEvent {

    private Long invoiceId;
    private Long customerId;
    private Long subscriptionId;
    private String invoiceNumber;
    private BigDecimal totalAmount;
    private LocalDate dueDate;
}
