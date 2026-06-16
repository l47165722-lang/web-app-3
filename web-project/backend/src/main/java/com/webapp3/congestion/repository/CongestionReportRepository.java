package com.webapp3.congestion.repository;

import com.webapp3.congestion.domain.CongestionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CongestionReportRepository extends JpaRepository<CongestionReport, Long> {

    List<CongestionReport> findByZoneIdAndCreatedAtAfter(Long zoneId, LocalDateTime cutoff);

    // 쿨다운 체크: 해당 학생이 해당 식당에 cutoff 이후 제보한 적이 있는지
    boolean existsByStudentIdAndZoneIdAndCreatedAtAfter(String studentId, Long zoneId, LocalDateTime cutoff);

    List<CongestionReport> findTop20ByStudentIdOrderByCreatedAtDesc(String studentId);

    @Query("SELECT r FROM CongestionReport r WHERE r.createdAt >= :startOfDay ORDER BY r.createdAt")
    List<CongestionReport> findTodaysReports(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT r FROM CongestionReport r WHERE r.createdAt >= :startOfDay AND r.zone.id = :zoneId ORDER BY r.createdAt")
    List<CongestionReport> findTodaysReportsByZone(@Param("startOfDay") LocalDateTime startOfDay, @Param("zoneId") Long zoneId);
}
