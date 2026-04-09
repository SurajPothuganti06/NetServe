package com.netserve.notification.repository;

import com.netserve.notification.entity.Notification;
import com.netserve.notification.entity.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    Page<Notification> findByCustomerIdAndStatusOrderByCreatedAtDesc(
            Long customerId, NotificationStatus status, Pageable pageable);

    long countByCustomerIdAndStatus(Long customerId, NotificationStatus status);

    @Modifying
    @Query("UPDATE Notification n SET n.status = :status WHERE n.customerId = :customerId AND n.status = 'UNREAD'")
    int markAllAsRead(@Param("customerId") Long customerId, @Param("status") NotificationStatus status);

    void deleteByCustomerId(Long customerId);
}
