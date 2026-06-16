import React, { useState, useEffect, useRef } from "react";
import "./App1.css";
import Header from "../common/Header";
import List from "./List";
import CongestionChart from "./CongestionChart";
import { API_BASE, submitReport } from "../api";

export default function App1() {
  const studentId = localStorage.getItem('studentId') || sessionStorage.getItem('studentId');
  const [zones, setZones] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const feedbackTimer = useRef(null);

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedbackMsg(''), 2500);
  };

  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  useEffect(() => {
    const fetchZones = () => {
      fetch(`${API_BASE}/api/zones`)
        .then(res => res.json())
        .then(data => {
          setZones(data.map(zone => ({
            id: zone.zoneId,
            name: zone.zoneName,
            level: zone.level,
            label: zone.label,
            reportCount: zone.reportCount,
            lastReportedSecondsAgo: zone.lastReportedSecondsAgo,
          })));
        })
        .catch(err => console.error("구역 데이터 로드 실패:", err));
    };

    fetchZones();
    const interval = setInterval(fetchZones, 5000); // 5초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const onReport = (id, level) => {
    submitReport(id, level, studentId).then(result => showFeedback(result.message));
  };

  const totalReports = zones.reduce((sum, z) => sum + z.reportCount, 0);
  const highCount    = zones.filter(z => z.level === "HIGH").length;
  const unknownCount = zones.filter(z => z.level === "UNKNOWN").length;

  return (
    <div className="App1">
      {feedbackMsg && <div className="a1-toast">{feedbackMsg}</div>}
      <Header />

      <div className="app1-content">
        <div className="dashboard_horiz_container">
          <div className="dash_item">
            <p className="dash_label">총 제보 수</p>
            <p className="dash_value_highlight">{totalReports}건</p>
          </div>
          <div className="dash_item">
            <p className="dash_label">혼잡한 구역</p>
            <p className="dash_value">{highCount}곳</p>
          </div>
          <div className="dash_item">
            <p className="dash_label">정보 없음</p>
            <p className="dash_value">{unknownCount}곳</p>
          </div>
        </div>

        <CongestionChart />

        <div className="list_main_wrapper">
          <List zones={zones} onReport={onReport} />
        </div>
      </div>
    </div>
  );
}
