package com.netserve.usage.repository;

import com.netserve.usage.entity.Device;
import com.netserve.usage.entity.DeviceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByMacAddress(String macAddress);

    boolean existsByMacAddress(String macAddress);

    Page<Device> findByCustomerId(Long customerId, Pageable pageable);

    java.util.List<Device> findByCustomerId(Long customerId);

    Page<Device> findByCustomerIdAndStatus(Long customerId, DeviceStatus status, Pageable pageable);

    void deleteByCustomerId(Long customerId);
}
