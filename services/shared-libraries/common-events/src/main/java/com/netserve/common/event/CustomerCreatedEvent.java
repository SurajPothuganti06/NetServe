package com.netserve.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CustomerCreatedEvent extends BaseEvent {

    private Long customerId;
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String accountType; // RESIDENTIAL or BUSINESS
}
