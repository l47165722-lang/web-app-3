import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import CongestionChart from './CongestionChart';
import './ZoneDetail.css';
import './App1.css';
import { API_BASE } from '../api';

const BUILDINGS = [
  { name: '공대식당',    prefix: '공대식당 ',    color: '#2563EB' },
  { name: '구 바우어관', prefix: '구 바우어관 ', color: '#7C3AED' },
  { name: '신 바우어관', prefix: '신 바우어관 ', color: '#059669' },
  { name: '아람관',      prefix: '아람관 ',       color: '#D97706' },
];

// 임시: 항상 제보 가능하도록 운영시간 체크 비활성화
// 되돌리려면 아래 BUILDING_HOURS 주석을 풀고 isBuildingClosed 원래 로직을 복원
/*
const BUILDING_HOURS = {
  '공대식당':    { weekday: [10*60, 19*60+30], saturday: [11*60, 15*60], sunday: null },
  '구 바우어관': { weekday: [9*60,  19*60],    saturday: null,           sunday: null },
  '신 바우어관': { weekday: [9*60,  19*60],    saturday: null,           sunday: null },
  '아람관':      { weekday: [7*60+30, 19*60],  saturday: null,           sunday: null },
};
*/

const isBuildingClosed = (buildingName) => {
  return false;
};

const LEVEL_TO_PERCENT = { LOW: 22, MEDIUM: 58, HIGH: 94, UNKNOWN: 0 };
const SIGNAL_COLOR = { LOW: '#16A34A', MEDIUM: '#D97706', HIGH: '#DC2626' };
const LEVEL_BG    = { LOW: '#D1FAE5', MEDIUM: '#FEF3C7', HIGH: '#FEE2E2' };
const LEVEL_COLOR = { LOW: '#059669', MEDIUM: '#D97706', HIGH: '#DC2626' };

const formatAgo = (seconds) => {
  if (seconds == null) return null;
  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  return `${Math.floor(seconds / 3600)}시간 전`;
};

function SignalBars({ count, level }) {
  const filled = count >= 7 ? 3 : count >= 3 ? 2 : count >= 1 ? 1 : 0;
  const color = SIGNAL_COLOR[level] || '#9CA3AF';
  const heights = [8, 13, 18];
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" style={{ verticalAlign: 'middle', marginRight: 4, flexShrink: 0 }}>
      {heights.map((h, i) => (
        <rect key={i} x={i * 7 + 1} y={18 - h} width="5" height={h} rx="1.5"
          fill={i < filled ? color : '#E5E7EB'} />
      ))}
    </svg>
  );
}

export default function ZoneDetail() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || sessionStorage.getItem('studentId');

  const [zone, setZone] = useState(null);
  const [justVoted, setJustVoted] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const feedbackTimer = useRef(null);

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedbackMsg(''), 2500);
  };

  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  useEffect(() => {
    const fetchZone = () => {
      fetch(`${API_BASE}/api/zones/${zoneId}/congestion`)
        .then(r => r.json())
        .then(setZone)
        .catch(() => {});
    };
    fetchZone();
    const id = setInterval(fetchZone, 5000);
    return () => clearInterval(id);
  }, [zoneId]);

  const building = zone ? BUILDINGS.find(b => zone.zoneName.startsWith(b.prefix)) : null;
  const displayName = building ? zone.zoneName.replace(building.prefix, '') : zone?.zoneName;
  const isClosed = building ? isBuildingClosed(building.name) : false;
  const levelClass = !zone || isClosed || zone.level === 'UNKNOWN' ? 'none' : zone.level.toLowerCase();
  const percent = !zone || isClosed ? 0 : (LEVEL_TO_PERCENT[zone.level] ?? 0);
  const agoText = zone ? formatAgo(zone.lastReportedSecondsAgo) : null;

  const handleReport = (e, lvl) => {
    e.stopPropagation();
    if (isClosed) return;
    setJustVoted(lvl);
    setTimeout(() => setJustVoted(null), 2000);
    fetch(`${API_BASE}/api/zones/${zoneId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: lvl, studentId }),
    })
      .then(() => showFeedback('제보가 완료되었습니다! 감사합니다.'))
      .catch(() => showFeedback('제보 전송에 실패했습니다.'));
  };

  if (!zone) return (
    <div className="zd">
      <Header />
      <div className="zd-loading">불러오는 중...</div>
    </div>
  );

  return (
    <div className="zd" style={{ '--bc': building?.color || '#2563EB' }}>
      {feedbackMsg && <div className="a1-toast">{feedbackMsg}</div>}
      <Header />

      <div className="zd-main">
        <button className="zd-back" onClick={() => navigate('/congestion')}>← 목록으로</button>

        {/* 구역 헤더 */}
        <div className="zd-hdr">
          <div className="zd-hdr-left">
            <span className="zd-building-dot" style={{ background: building?.color }} />
            <span className="zd-building-name">{building?.name}</span>
          </div>
          {isClosed
            ? <span className="zd-status-badge closed">운영 종료</span>
            : zone.level !== 'UNKNOWN' && zone.label
              ? <span className="zd-status-badge"
                  style={{ background: LEVEL_BG[zone.level], color: LEVEL_COLOR[zone.level] }}>
                  {zone.label}
                </span>
              : null
          }
        </div>

        <h1 className="zd-zone-name">{displayName}</h1>

        {/* 혼잡도 카드 */}
        <div className="zd-card">
          <div className="gauge_bar_track" style={{ marginBottom: 16 }}>
            <div className={`gauge_bar_fill ${levelClass}`} style={{ width: `${percent}%` }} />
          </div>

          <div className="zd-report-info">
            {isClosed
              ? <span className="no_report">오늘 운영이 종료되었습니다</span>
              : zone.reportCount > 0
                ? <>
                    <SignalBars count={zone.reportCount} level={zone.level} />
                    최근 <strong>{zone.reportCount}건</strong>의 제보
                    {agoText && <span className="ago_text"> · {agoText}</span>}
                  </>
                : <span className="no_report">최근 20분 이내 제보 없음</span>
            }
          </div>

          <div className="report_btn_row">
            {[['LOW', '여유'], ['MEDIUM', '보통'], ['HIGH', '혼잡']].map(([lvl, lbl]) => (
              <button
                key={lvl}
                className={`btn_report btn_${lvl.toLowerCase()}${justVoted === lvl ? ' btn_voted' : ''}`}
                onClick={(e) => handleReport(e, lvl)}
                disabled={isClosed}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* 이 구역의 시간대별 차트 */}
        <CongestionChart zoneId={Number(zoneId)} title={`${displayName} 오늘 제보 현황`} />
      </div>
    </div>
  );
}
