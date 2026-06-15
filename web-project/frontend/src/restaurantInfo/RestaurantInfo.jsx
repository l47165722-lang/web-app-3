import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../MenuReView/Header';
import './RestaurantInfo.css';

const RESTAURANTS = [
  {
    building: '공대식당',
    color: '#2563EB',
    prefix: '공대식당 ',
    location: '계명대학교 복지관 1 · 2층',
    hours: { weekday: '10:00 ~ 19:30', saturday: '11:00 ~ 15:00', sunday: '휴무' },
    weekdayRange: [10*60, 19*60+30],
    saturdayRange: [11*60, 15*60],
    sundayRange: null,
  },
  {
    building: '구 바우어관',
    color: '#7C3AED',
    prefix: '구 바우어관 ',
    location: '구 바우어관 지하 1층',
    hours: { weekday: '09:00 ~ 19:00', saturday: '휴무', sunday: '휴무' },
    weekdayRange: [9*60, 19*60],
    saturdayRange: null,
    sundayRange: null,
  },
  {
    building: '신 바우어관',
    color: '#059669',
    prefix: '신 바우어관 ',
    location: '신 바우어관 2층 푸드코트',
    hours: { weekday: '09:00 ~ 19:00', saturday: '휴무', sunday: '휴무' },
    weekdayRange: [9*60, 19*60],
    saturdayRange: null,
    sundayRange: null,
  },
  {
    building: '아람관',
    color: '#D97706',
    prefix: '아람관 ',
    location: '아람관 3층',
    hours: { weekday: '07:30 ~ 19:00', saturday: '휴무', sunday: '휴무' },
    weekdayRange: [7*60+30, 19*60],
    saturdayRange: null,
    sundayRange: null,
  },
];

const LEVEL_LABEL = { LOW: '여유', MEDIUM: '보통', HIGH: '혼잡', UNKNOWN: '정보 없음' };
const LEVEL_COLOR = { LOW: '#16A34A', MEDIUM: '#D97706', HIGH: '#EF4444', UNKNOWN: '#9CA3AF' };
const LEVEL_BG    = { LOW: '#F0FDF4', MEDIUM: '#FFFBEB', HIGH: '#FEF2F2', UNKNOWN: '#F9FAFB' };

const isOpen = (r) => {
  const now = new Date();
  const day = now.getDay();
  const cur = now.getHours() * 60 + now.getMinutes();
  const range = day === 0 ? r.sundayRange : day === 6 ? r.saturdayRange : r.weekdayRange;
  if (!range) return false;
  return cur >= range[0] && cur < range[1];
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function RestaurantInfo() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetch('/api/zones')
      .then(r => r.json())
      .then(setZones)
      .catch(() => {});
  }, []);

  const today = DAY_LABELS[new Date().getDay()];

  return (
    <div className="ri">
      <Header />

      <main className="ri-main">
        <div className="ri-top">
          <h1 className="ri-title">식당 정보</h1>
          <p className="ri-sub">운영시간과 현재 혼잡도를 한눈에 확인하세요</p>
        </div>

        <div className="ri-grid">
          {RESTAURANTS.map(r => {
            const open = isOpen(r);
            const myZones = zones.filter(z => z.zoneName?.startsWith(r.prefix));

            return (
              <div key={r.building} className="ri-card" style={{ '--rc': r.color }}>
                {/* 카드 헤더 */}
                <div className="ri-card-hdr">
                  <div className="ri-card-title-row">
                    <span className="ri-card-dot" style={{ background: open ? r.color : '#D1D5DB' }} />
                    <h2 className="ri-card-name">{r.building}</h2>
                  </div>
                  <span className={`ri-status-badge ${open ? 'open' : 'closed'}`}>
                    {open ? '운영 중' : '운영 종료'}
                  </span>
                </div>

                {/* 위치 */}
                <p className="ri-location">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {r.location}
                </p>

                {/* 구역별 현재 혼잡도 */}
                {myZones.length > 0 && (
                  <div className="ri-zones">
                    {myZones.map(z => {
                      const lvl = open ? (z.level || 'UNKNOWN') : 'UNKNOWN';
                      const floor = z.zoneName.replace(r.prefix, '');
                      return (
                        <div key={z.zoneId} className="ri-zone-row">
                          <span className="ri-zone-floor">{floor}</span>
                          <span
                            className="ri-zone-badge"
                            style={{ color: open ? LEVEL_COLOR[lvl] : '#9CA3AF', background: open ? LEVEL_BG[lvl] : '#F9FAFB' }}
                          >
                            {open ? LEVEL_LABEL[lvl] : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 운영 시간 테이블 */}
                <div className="ri-hours">
                  <p className="ri-hours-title">운영시간</p>
                  <div className="ri-hours-row">
                    <span className={`ri-day${today !== '토' && today !== '일' ? ' ri-day-today' : ''}`}>평일</span>
                    <span className="ri-time">{r.hours.weekday}</span>
                  </div>
                  <div className="ri-hours-row">
                    <span className={`ri-day${today === '토' ? ' ri-day-today' : ''}`}>토요일</span>
                    <span className={`ri-time${r.hours.saturday === '휴무' ? ' ri-closed' : ''}`}>{r.hours.saturday}</span>
                  </div>
                  <div className="ri-hours-row">
                    <span className={`ri-day${today === '일' ? ' ri-day-today' : ''}`}>일요일</span>
                    <span className="ri-time ri-closed">{r.hours.sunday}</span>
                  </div>
                </div>

                <button
                  className="ri-goto-btn"
                  style={{ color: r.color, borderColor: r.color }}
                  onClick={() => navigate('/congestion')}
                >
                  혼잡도 제보하러 가기 →
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
