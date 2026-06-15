package com.webapp3.congestion.service;

import com.webapp3.congestion.domain.CongestionLevel;
import com.webapp3.congestion.domain.CongestionReport;
import com.webapp3.congestion.domain.Zone;
import com.webapp3.congestion.dto.ZoneCongestionResponse;
import com.webapp3.congestion.repository.CongestionReportRepository;
import com.webapp3.congestion.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.webapp3.congestion.dto.HourlyStats;
import com.webapp3.congestion.dto.ReportHistoryItem;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class CongestionService {

    private static final int VALID_MINUTES = 20;

    private final ZoneRepository zoneRepository;
    private final CongestionReportRepository reportRepository;

    public ZoneCongestionResponse getCurrentCongestion(Long zoneId) {
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 구역입니다. zoneId=" + zoneId));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.minusMinutes(VALID_MINUTES);
        List<CongestionReport> recentReports = reportRepository.findByZoneIdAndCreatedAtAfter(zoneId, cutoff);

        // 시간 가중 평균: 방금=1.0, 20분 전≈0 선형 감소
        long validSeconds = (long) VALID_MINUTES * 60;
        double userWeightedSum = 0;
        double userTotalWeight = 0;
        LocalDateTime lastReportedAt = null;

        for (CongestionReport report : recentReports) {
            LocalDateTime createdAt = report.getCreatedAt();
            long secsAgo = Duration.between(createdAt, now).getSeconds();
            double w = Math.max(0.0, (double)(validSeconds - secsAgo) / validSeconds);
            userWeightedSum += report.getLevel().getScore() * w;
            userTotalWeight += w;
            if (lastReportedAt == null || createdAt.isAfter(lastReportedAt)) {
                lastReportedAt = createdAt;
            }
        }

        double[] base = getTimeBase(zone.getName(), now);
        double baseScore  = base[0]; // 1=여유, 2=보통, 3=혼잡, 0=비활성
        double baseWeight = base[1]; // 시간 기준값 비중 (사용자 비중 = 1 - baseWeight)

        double finalScore;
        if (userTotalWeight > 0 && baseWeight > 0) {
            double userScore = userWeightedSum / userTotalWeight;
            finalScore = userScore * (1 - baseWeight) + baseScore * baseWeight;
        } else if (userTotalWeight > 0) {
            finalScore = userWeightedSum / userTotalWeight;
        } else if (baseScore > 0) {
            finalScore = baseScore;
        } else {
            return ZoneCongestionResponse.of(zone.getId(), zone.getName(), CongestionLevel.UNKNOWN, 0, null);
        }

        Long secondsAgo = lastReportedAt != null
                ? Duration.between(lastReportedAt, now).getSeconds()
                : null;

        CongestionLevel finalLevel = CongestionLevel.fromScore(finalScore);
        return ZoneCongestionResponse.of(zone.getId(), zone.getName(), finalLevel, recentReports.size(), secondsAgo);
    }

    // [0] baseScore: 0=비활성, 1=여유, 2=보통, 3=혼잡 / [1] baseWeight: 0~1
    private double[] getTimeBase(String zoneName, LocalDateTime now) {
        int totalMin = now.getHour() * 60 + now.getMinute();

        // 9시 이전: 전 구역 여유 기준값 75%
        if (totalMin < 9 * 60) {
            return new double[]{1.0, 0.75};
        }

        // 전 식당 점심 (11:45~13:15 혼잡, 이후 14:00까지 선형 감소)
        int lunchStart = 11 * 60 + 45;
        int lunchEnd   = 13 * 60 + 15;
        int fadeEnd    = 14 * 60;

        if (totalMin >= lunchStart && totalMin < lunchEnd) {
            return new double[]{3.0, 0.85};
        }
        if (totalMin >= lunchEnd && totalMin < fadeEnd) {
            double t = (double)(totalMin - lunchEnd) / (fadeEnd - lunchEnd);
            return new double[]{3.0 - 2.0 * t, 0.85 * (1 - t)};
        }

        return new double[]{0, 0};
    }

    public List<ZoneCongestionResponse> getAllCurrentCongestion() {
        return zoneRepository.findAll().stream()
                .map(zone -> getCurrentCongestion(zone.getId()))
                .toList();
    }

    public void submitReport(Long zoneId, CongestionLevel level, String studentId) {
        if (level == null || level == CongestionLevel.UNKNOWN) {
            throw new IllegalArgumentException("올바른 혼잡도 등급을 선택해주세요.");
        }
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 구역입니다. zoneId=" + zoneId));
        reportRepository.save(new CongestionReport(zone, level, LocalDateTime.now(), studentId));
    }

    public List<HourlyStats> getZoneHourlyStats(Long zoneId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<CongestionReport> reports = reportRepository.findTodaysReportsByZone(startOfDay, zoneId);
        return buildHourlyBuckets(reports);
    }

    public List<HourlyStats> getTodayHourlyStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return buildHourlyBuckets(reportRepository.findTodaysReports(startOfDay));
    }

    private List<HourlyStats> buildHourlyBuckets(List<CongestionReport> reports) {
        Map<Integer, long[]> buckets = new TreeMap<>();
        for (int h = 8; h <= 20; h++) buckets.put(h, new long[]{0, 0, 0});

        for (CongestionReport r : reports) {
            int hour = r.getCreatedAt().getHour();
            if (buckets.containsKey(hour)) {
                long[] counts = buckets.get(hour);
                switch (r.getLevel()) {
                    case LOW    -> counts[0]++;
                    case MEDIUM -> counts[1]++;
                    case HIGH   -> counts[2]++;
                    default -> {}
                }
            }
        }

        return buckets.entrySet().stream()
                .map(e -> new HourlyStats(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .toList();
    }

    public List<ReportHistoryItem> getReportHistory(String studentId) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("M월 d일 HH:mm");
        return reportRepository.findTop20ByStudentIdOrderByCreatedAtDesc(studentId)
                .stream()
                .map(r -> new ReportHistoryItem(
                        r.getId(),
                        r.getZone().getName(),
                        r.getLevel().name(),
                        r.getLevel().getLabel(),
                        r.getCreatedAt().format(fmt)
                ))
                .toList();
    }
}
