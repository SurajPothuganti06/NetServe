package com.netserve.support.service;

import com.netserve.common.event.OutageDeclaredEvent;
import com.netserve.support.dto.DeclareOutageRequest;
import com.netserve.support.dto.OutageResponse;
import com.netserve.support.entity.Outage;
import com.netserve.support.entity.OutageStatus;
import com.netserve.support.kafka.SupportEventPublisher;
import com.netserve.support.repository.OutageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutageService {

    private final OutageRepository outageRepository;
    private final SupportEventPublisher eventPublisher;

    @Transactional
    public OutageResponse declareOutage(DeclareOutageRequest request) {
        Outage outage = Outage.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .affectedArea(request.getAffectedArea())
                .severity(request.getSeverity().toUpperCase())
                .status(OutageStatus.DECLARED)
                .startTime(request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now())
                .estimatedResolution(request.getEstimatedResolution())
                .build();

        outage = outageRepository.save(outage);
        log.info("Outage declared: id={}, area={}, severity={}",
                outage.getId(), outage.getAffectedArea(), outage.getSeverity());

        // Publish Kafka event
        eventPublisher.publishOutageDeclared(OutageDeclaredEvent.builder()
                .outageId(outage.getId())
                .title(outage.getTitle())
                .affectedArea(outage.getAffectedArea())
                .severity(outage.getSeverity())
                .startTime(outage.getStartTime())
                .estimatedResolution(outage.getEstimatedResolution())
                .build());

        return toResponse(outage);
    }

    public OutageResponse getOutage(Long id) {
        Outage outage = outageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outage not found"));
        return toResponse(outage);
    }

    public List<OutageResponse> getActiveOutages() {
        return outageRepository.findByStatusNot(OutageStatus.RESOLVED)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public OutageResponse updateOutageStatus(Long id, String status) {
        Outage outage = outageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outage not found"));

        OutageStatus newStatus = OutageStatus.valueOf(status.toUpperCase());
        outage.setStatus(newStatus);
        outage = outageRepository.save(outage);
        log.info("Outage status updated: id={}, status={}", id, newStatus);
        return toResponse(outage);
    }

    @Transactional
    public OutageResponse resolveOutage(Long id) {
        Outage outage = outageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outage not found"));

        outage.setStatus(OutageStatus.RESOLVED);
        outage.setResolvedAt(LocalDateTime.now());
        outage = outageRepository.save(outage);
        log.info("Outage resolved: id={}", id);
        return toResponse(outage);
    }

    // ─── Mapper ────────────────────────────────────────

    private OutageResponse toResponse(Outage outage) {
        return OutageResponse.builder()
                .id(outage.getId())
                .title(outage.getTitle())
                .description(outage.getDescription())
                .affectedArea(outage.getAffectedArea())
                .severity(outage.getSeverity())
                .status(outage.getStatus().name())
                .startTime(outage.getStartTime())
                .estimatedResolution(outage.getEstimatedResolution())
                .resolvedAt(outage.getResolvedAt())
                .createdAt(outage.getCreatedAt())
                .build();
    }
}
