package com.webapp3.congestion.exception;

// 쿨다운 시간 내에 같은 사용자가 같은 식당을 재제보할 때 발생
public class DuplicateReportException extends RuntimeException {
    public DuplicateReportException(String message) {
        super(message);
    }
}
