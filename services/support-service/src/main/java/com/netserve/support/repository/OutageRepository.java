package com.netserve.support.repository;

import com.netserve.support.entity.Outage;
import com.netserve.support.entity.OutageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutageRepository extends JpaRepository<Outage, Long> {

    List<Outage> findByStatusNot(OutageStatus status);

    Page<Outage> findByStatus(OutageStatus status, Pageable pageable);

    List<Outage> findByAffectedAreaContainingIgnoreCase(String area);
}
