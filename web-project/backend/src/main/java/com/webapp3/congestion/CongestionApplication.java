package com.webapp3.congestion;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class CongestionApplication {

	// 서버가 UTC로 동작해도 모든 LocalDateTime.now()/LocalDate.now()가 한국시간 기준이 되도록 고정
	@PostConstruct
	public void setDefaultTimeZone() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
	}

	public static void main(String[] args) {
		SpringApplication.run(CongestionApplication.class, args);
	}

}
