package com.netserve.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PaymentSuccessfulEvent extends BaseEvent {

    private Long paymentId;
    private Long invoiceId;
    private Long customerId;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionRef;
}
