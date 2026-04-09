package com.netserve.customer.service;

import com.netserve.common.event.CustomerCreatedEvent;
import com.netserve.common.event.CustomerStatusChangedEvent;
import com.netserve.customer.dto.*;
import com.netserve.customer.entity.*;
import com.netserve.customer.kafka.CustomerEventPublisher;
import com.netserve.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerEventPublisher eventPublisher;

    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Customer with this email already exists");
        }

        Address address = null;
        if (request.getStreet() != null) {
            address = Address.builder()
                    .street(request.getStreet())
                    .city(request.getCity())
                    .state(request.getState())
                    .zipCode(request.getZipCode())
                    .country(request.getCountry() != null ? request.getCountry() : "US")
                    .apartment(request.getApartment())
                    .serviceAvailable(checkServiceAvailability(request.getZipCode()))
                    .build();
        }

        AccountType accountType = "BUSINESS".equalsIgnoreCase(request.getAccountType())
                ? AccountType.BUSINESS
                : AccountType.RESIDENTIAL;

        Customer customer = Customer.builder()
                .userId(request.getUserId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .accountType(accountType)
                .status(CustomerStatus.ACTIVE)
                .address(address)
                .build();

        customer = customerRepository.save(customer);
        log.info("Customer created: id={}, email={}", customer.getId(), customer.getEmail());

        // Publish Kafka event
        eventPublisher.publishCustomerCreated(CustomerCreatedEvent.builder()
                .customerId(customer.getId())
                .userId(customer.getUserId())
                .email(customer.getEmail())
                .firstName(customer.getFirstName())
                .lastName(customer.getLastName())
                .accountType(customer.getAccountType().name())
                .build());

        return toResponse(customer);
    }

    public CustomerResponse getCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return toResponse(customer);
    }

    public CustomerResponse getCustomerByUserId(Long userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return toResponse(customer);
    }

    @Transactional
    public void deleteCustomerByUserId(Long userId) {
        customerRepository.findByUserId(userId).ifPresent(customer -> {
            Long customerId = customer.getId();
            customerRepository.delete(customer);
            log.info("Customer deleted: id={}, userId={}", customerId, userId);

            // Publish event down the chain
            eventPublisher.publishCustomerDeleted(
                    com.netserve.common.event.CustomerDeletedEvent.builder()
                            .customerId(customerId)
                            .build()
            );
        });
    }

    public Page<CustomerResponse> getAllCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (request.getFirstName() != null)
            customer.setFirstName(request.getFirstName());
        if (request.getLastName() != null)
            customer.setLastName(request.getLastName());
        if (request.getPhone() != null)
            customer.setPhone(request.getPhone());

        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse updateAddress(Long id, UpdateAddressRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Address address = customer.getAddress();
        if (address == null) {
            address = new Address();
        }

        address.setStreet(request.getStreet());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setZipCode(request.getZipCode());
        address.setCountry(request.getCountry() != null ? request.getCountry() : "US");
        address.setApartment(request.getApartment());
        address.setServiceAvailable(checkServiceAvailability(request.getZipCode()));

        customer.setAddress(address);
        customer = customerRepository.save(customer);
        log.info("Address updated for customer id={}", id);

        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse updateStatus(Long id, String newStatus, String reason) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        String previousStatus = customer.getStatus().name();
        CustomerStatus status = CustomerStatus.valueOf(newStatus.toUpperCase());
        customer.setStatus(status);
        customer = customerRepository.save(customer);

        // Publish Kafka event
        eventPublisher.publishCustomerStatusChanged(CustomerStatusChangedEvent.builder()
                .customerId(customer.getId())
                .previousStatus(previousStatus)
                .newStatus(status.name())
                .reason(reason)
                .build());

        log.info("Customer status changed: id={}, {} -> {}", id, previousStatus, status.name());
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse upgradeToBusiness(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (customer.getAccountType() == AccountType.BUSINESS) {
            throw new RuntimeException("Customer is already a business account");
        }

        customer.setAccountType(AccountType.BUSINESS);
        customer = customerRepository.save(customer);
        log.info("Customer upgraded to BUSINESS: id={}", id);

        return toResponse(customer);
    }

    public boolean checkServiceAvailability(String zipCode) {
        // Simulated service availability check
        // In production, this would query a coverage database
        return zipCode != null && zipCode.length() == 5;
    }

    // ─── Mapper ────────────────────────────────────────

    private CustomerResponse toResponse(Customer customer) {
        CustomerResponse.AddressResponse addressResponse = null;
        if (customer.getAddress() != null) {
            Address addr = customer.getAddress();
            addressResponse = CustomerResponse.AddressResponse.builder()
                    .street(addr.getStreet())
                    .city(addr.getCity())
                    .state(addr.getState())
                    .zipCode(addr.getZipCode())
                    .country(addr.getCountry())
                    .apartment(addr.getApartment())
                    .serviceAvailable(addr.isServiceAvailable())
                    .build();
        }

        return CustomerResponse.builder()
                .id(customer.getId())
                .userId(customer.getUserId())
                .firstName(customer.getFirstName())
                .lastName(customer.getLastName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .accountType(customer.getAccountType().name())
                .status(customer.getStatus().name())
                .address(addressResponse)
                .build();
    }
}
