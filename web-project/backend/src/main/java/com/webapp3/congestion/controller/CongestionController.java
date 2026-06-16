package com.webapp3.congestion.controller;

import com.webapp3.congestion.dto.HourlyStats;
import com.webapp3.congestion.dto.ReportHistoryItem;
import com.webapp3.congestion.dto.ReportRequest;
import com.webapp3.congestion.dto.ZoneCongestionResponse;
import com.webapp3.congestion.exception.DuplicateReportException;
import com.webapp3.congestion.service.CongestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
public class CongestionController {

    private final CongestionService congestionService;

    @GetMapping
    public List<ZoneCongestionResponse> getAllCongestion() {
        return congestionService.getAllCurrentCongestion();
    }

    @GetMapping("/{zoneId}/congestion")
    public ZoneCongestionResponse getCongestion(@PathVariable Long zoneId) {
        return congestionService.getCurrentCongestion(zoneId);
    }

    @PostMapping("/{zoneId}/reports")
    public ResponseEntity<Void> submitReport(@PathVariable Long zoneId, @RequestBody ReportRequest request) {
        congestionService.submitReport(zoneId, request.getLevel(), request.getStudentId());
        return ResponseEntity.ok().build();
    }

    // /history가 /{zoneId} 패턴보다 먼저 매핑되도록 순서 주의
    @GetMapping("/history")
    public List<ReportHistoryItem> getReportHistory(@RequestParam String studentId) {
        return congestionService.getReportHistory(studentId);
    }

    @GetMapping("/stats/today")
    public List<HourlyStats> getTodayStats() {
        return congestionService.getTodayHourlyStats();
    }

    @GetMapping("/{zoneId}/stats/today")
    public List<HourlyStats> getZoneStats(@PathVariable Long zoneId) {
        return congestionService.getZoneHourlyStats(zoneId);
    }

    // 쿨다운 내 재제보 → 409 Conflict + 안내 메시지
    @ExceptionHandler(DuplicateReportException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateReport(DuplicateReportException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }
}
