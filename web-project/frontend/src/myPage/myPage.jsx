import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './myPage_style.css';
import { API_BASE } from '../api';

const LEVEL_COLOR = { LOW: '#16A34A', MEDIUM: '#D97706', HIGH: '#DC2626' };
const LEVEL_BG    = { LOW: '#F0FDF4', MEDIUM: '#FFFBEB', HIGH: '#FEF2F2' };

export default function MyPage() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || sessionStorage.getItem('studentId');
  const loginType = localStorage.getItem('loginType') || sessionStorage.getItem('loginType');
  const isGoogle = loginType === 'google';
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    if (!studentId) navigate('/login');
  }, [navigate, studentId]);

  useEffect(() => {
    if (!studentId) return;
    fetch(`${API_BASE}/api/zones/history?studentId=${encodeURIComponent(studentId)}`)
      .then(res => res.json())
      .then(data => { setHistory(data); setHistLoading(false); })
      .catch(() => setHistLoading(false));
  }, [studentId]);

  const clearAuth = () => {
    localStorage.removeItem('studentId');
    localStorage.removeItem('loginType');
    localStorage.removeItem('isLogin');
    sessionStorage.removeItem('studentId');
    sessionStorage.removeItem('loginType');
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 영구적으로 삭제됩니다.')) return;
    try {
      const res = await fetch(`${API_BASE}/deleteUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('회원탈퇴가 완료되었습니다.');
        clearAuth();
        navigate('/login');
      } else {
        alert('회원 정보를 찾을 수 없습니다.');
      }
    } catch {
      alert('서버 연결 실패');
    }
  };

  return (
    <div className="myp">
      <header className="myp-hdr">
        <span className="myp-logo" onClick={() => navigate('/main')}>밥탐</span>
        <button className="myp-back" onClick={() => navigate('/main')}>← 메인으로</button>
      </header>

      <main className="myp-main">
        <div className="myp-container">

          {/* 프로필 */}
          <section className="myp-profile-section">
            <div className="myp-avatar-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <h1 className="myp-name">{studentId}</h1>
            <span className="myp-badge">{isGoogle ? 'Google 계정' : '일반 회원'}</span>
          </section>

          {/* 계정 정보 */}
          <section className="myp-section">
            <h2 className="myp-section-title">계정 정보</h2>
            <div className="myp-info-row">
              <span className="myp-info-label">로그인 방식</span>
              <span className="myp-info-value">{isGoogle ? 'Google 소셜 로그인' : '학번/비밀번호'}</span>
            </div>
            <div className="myp-info-row">
              <span className="myp-info-label">{isGoogle ? '이메일' : '학번'}</span>
              <span className="myp-info-value">{studentId}</span>
            </div>
          </section>

          {/* 제보 내역 */}
          <section className="myp-section">
            <h2 className="myp-section-title">제보 내역</h2>
            {histLoading ? (
              <p className="myp-empty">불러오는 중...</p>
            ) : history.length === 0 ? (
              <p className="myp-empty">아직 제보 내역이 없어요</p>
            ) : (
              <div className="myp-history-list">
                {history.map(item => (
                  <div key={item.reportId} className="myp-report-row">
                    <div className="myp-report-left">
                      <span className="myp-report-zone">{item.zoneName}</span>
                      <span className="myp-report-time">{item.reportedAt}</span>
                    </div>
                    <span
                      className="myp-report-badge"
                      style={{ color: LEVEL_COLOR[item.level], background: LEVEL_BG[item.level] }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 계정 관리 */}
          <section className="myp-section">
            <h2 className="myp-section-title">계정 관리</h2>
            {isGoogle ? (
              <button className="myp-logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            ) : (
              <button className="myp-delete-btn" onClick={handleDeleteUser}>
                회원탈퇴
              </button>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
