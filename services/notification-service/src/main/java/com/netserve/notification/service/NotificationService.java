package com.netserve.notification.service;

import com.netserve.notification.dto.NotificationResponse;
import com.netserve.notification.entity.Notification;
import com.netserve.notification.entity.NotificationStatus;
import com.netserve.notification.entity.NotificationType;
import com.netserve.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(Long customerId, NotificationType type, String title, String message, String metadata) {
        Notification notification = Notification.builder()
                .customerId(customerId)
                .type(type)
                .title(title)
                .message(message)
                .status(NotificationStatus.UNREAD)
                .metadata(metadata)
                .build();

        notificationRepository.save(notification);
        log.info("Notification created: customerId={}, type={}, title={}", customerId, type, title);
    }

    public NotificationResponse getNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        return toResponse(notification);
    }

    public Page<NotificationResponse> getCustomerNotifications(Long customerId, Pageable pageable) {
        return notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount(Long customerId) {
        return notificationRepository.countByCustomerIdAndStatus(customerId, NotificationStatus.UNREAD);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setStatus(NotificationStatus.READ);
        notification = notificationRepository.save(notification);
        return toResponse(notification);
    }

    @Transactional
    public int markAllAsRead(Long customerId) {
        return notificationRepository.markAllAsRead(customerId, NotificationStatus.READ);
    }

    @Transactional
    public void deleteNotificationsByCustomerId(Long customerId) {
        notificationRepository.deleteByCustomerId(customerId);
        log.info("Deleted all notifications for customerId={}", customerId);
    }

    // ─── Mapper ────────────────────────────────────────

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .customerId(notification.getCustomerId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .status(notification.getStatus().name())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
