import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import './CongestionChart.css';
import { API_BASE } from '../api';

const COLORS = { low: '#16A34A', medium: '#F59E0B', high: '#EF4444' };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="cct-tip">
      <p className="cct-tip-hour">{label}</p>
      {payload.map(p => p.value > 0 && (
        <p key={p.dataKey} style={{ color: p.fill }}>{p.name} {p.value}건</p>
      ))}
      <p className="cct-tip-total">총 {total}건</p>
    </div>
  );
}

export default function CongestionChart({ zoneId = null, title = '오늘의 시간대별 제보 현황' }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = () => {
      const url = zoneId ? `${API_BASE}/api/zones/${zoneId}/stats/today` : `${API_BASE}/api/zones/stats/today`;
      fetch(url)
        .then(r => r.json())
        .then(d => setData(d.map(item => ({
          hour: `${item.hour}시`,
          여유: item.low,
          보통: item.medium,
          혼잡: item.high,
        }))))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [zoneId]);

  const hasData = data.some(d => d.여유 + d.보통 + d.혼잡 > 0);

  return (
    <div className="cct-card">
      <div className="cct-header">
        <h2 className="cct-title">{title}</h2>
        {!hasData && <span className="cct-empty">아직 오늘 제보 데이터가 없어요</span>}
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={13}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 13, fill: '#9CA3AF' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 13, fill: '#9CA3AF' }}
            axisLine={false} tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Legend
            iconType="circle" iconSize={8}
            wrapperStyle={{ fontSize: '13px', color: '#6B7280', paddingTop: '14px' }}
          />
          <Bar dataKey="여유" stackId="a" fill={COLORS.low} />
          <Bar dataKey="보통" stackId="a" fill={COLORS.medium} />
          <Bar dataKey="혼잡" stackId="a" fill={COLORS.high} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
