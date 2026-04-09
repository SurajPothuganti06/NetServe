package com.netserve.usage.repository;

import com.netserve.usage.entity.UsageRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface UsageRecordRepository extends JpaRepository<UsageRecord, Long> {

    Page<UsageRecord> findByCustomerId(Long customerId, Pageable pageable);

    Page<UsageRecord> findByDeviceId(Long deviceId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(u.downloadBytes), 0) FROM UsageRecord u " +
            "WHERE u.customerId = :customerId AND u.recordedAt >= :since")
    Long sumDownloadBytesByCustomerSince(@Param("customerId") Long customerId,
                                         @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(u.uploadBytes), 0) FROM UsageRecord u " +
            "WHERE u.customerId = :customerId AND u.recordedAt >= :since")
    Long sumUploadBytesByCustomerSince(@Param("customerId") Long customerId,
                                       @Param("since") LocalDateTime since);

    java.util.List<UsageRecord> findByCustomerIdAndRecordedAtAfter(Long customerId, LocalDateTime since);

    void deleteByCustomerId(Long customerId);
}
