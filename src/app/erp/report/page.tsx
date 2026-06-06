'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getCaregivers, type Caregiver } from '@/lib/caregiverStore';

interface AttendanceRecord {
  id: string;
  caregiverId: string;
  caregiverName: string;
  hospitalName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
}

interface HospitalSummary {
  hospitalName: string;
  totalHours: number;
  totalPay: number;
  caregiverCount: number;
  details: {
    caregiverName: string;
    days: number;
    hours: number;
    pay: number;
    hourlyRate: number;
  }[];
}

export default function ReportPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedHospital, setSelectedHospital] = useState('all');

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'attendance')),
      getCaregivers(),
    ]).then(([attSnap, cgList]) => {
      const attList: AttendanceRecord[] = [];
      attSnap.forEach(doc => {
        const d = doc.data();
        attList.push({
          id: doc.id,
          caregiverId: d.caregiverId || '',
          caregiverName: d.caregiverName || '',
          hospitalName: d.hospitalName || '',
          date: d.date || '',
          clockIn: d.clockIn || '',
          clockOut: d.clockOut || '',
          totalHours: d.totalHours || 0,
        });
      });
      setRecords(attList);
      setCaregivers(cgList);
      setLoading(false);
    });
  }, []);

  const summary = useMemo(() => {
    const target = `${year}-${String(month).padStart(2, '0')}`;
    const filtered = records.filter(r => r.date.startsWith(target));

    const cgRateMap: Record<string, number> = {};
    caregivers.forEach(c => { cgRateMap[c.id] = c.hourlyRate || 0; });

    const hospitalMap: Record<string, HospitalSummary> = {};

    filtered.forEach(r => {
      if (!r.hospitalName) return;
      if (!hospitalMap[r.hospitalName]) {
        hospitalMap[r.hospitalName] = {
          hospitalName: r.hospitalName,
          totalHours: 0,
          totalPay: 0,
          caregiverCount: 0,
          details: [],
        };
      }
      hospitalMap[r.hospitalName].totalHours += r.totalHours;

      const rate = cgRateMap[r.caregiverId] || 0;
      const pay = r.totalHours * rate;
      hospitalMap[r.hospitalName].totalPay += pay;

      const existing = hospitalMap[r.hospitalName].details.find(d => d.caregiverName === r.caregiverName);
      if (existing) {
        existing.days++;
        existing.hours += r.totalHours;
        existing.pay += pay;
      } else {
        hospitalMap[r.hospitalName].details.push({
          caregiverName: r.caregiverName,
          days: 1,
          hours: r.totalHours,
          pay,
          hourlyRate: rate,
        });
      }
    });

    Object.values(hospitalMap).forEach(h => {
      h.caregiverCount = h.details.length;
      h.details.sort((a, b) => b.hours - a.hours);
    });

    const result = Object.values(hospitalMap).sort((a, b) => b.totalPay - a.totalPay);
    if (selectedHospital !== 'all') return result.filter(h => h.hospitalName === selectedHospital);
    return result;
  }, [records, caregivers, year, month, selectedHospital]);

  const hospitalNames = useMemo(() => {
    const names = new Set<string>();
    records.forEach(r => { if (r.hospitalName) names.add(r.hospitalName); });
    return Array.from(names).sort();
  }, [records]);

  const totalAll = useMemo(() => ({
    hours: summary.reduce((s, h) => s + h.totalHours, 0),
    pay: summary.reduce((s, h) => s + h.totalPay, 0),
    hospitals: summary.length,
    caregivers: summary.reduce((s, h) => s + h.caregiverCount, 0),
  }), [summary]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const fmt = (n: number) => n.toLocaleString();

  const CHART_COLORS = ['#2D5A3D', '#1565C0', '#E65100', '#6A1B9A', '#00838F', '#C62828', '#4527A0', '#EF6C00', '#558B2F', '#283593'];
  const chartData = useMemo(() => {
    if (summary.length === 0) return [];
    const total = summary.reduce((s, h) => s + h.totalPay, 0);
    if (total === 0) return [];
    return summary.map((h, i) => ({
      name: h.hospitalName,
      value: h.totalPay,
      ratio: h.totalPay / total,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [summary]);

  // SVG 도넛 차트 세그먼트 미리 계산
  const chartSegments = useMemo(() => {
    const circumference = 2 * Math.PI * 38;
    let offset = 0;
    return chartData.map(d => {
      const dash = circumference * d.ratio;
      const seg = { ...d, dash, offset };
      offset += dash;
      return seg;
    });
  }, [chartData]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>📊 데이터 로딩 중...</div>;

  return (
    <div>
      <h2 style={{ color: '#2D5A3D', marginBottom: '1rem' }}>📊 병원별 매출 리포트</h2>

      {/* 월 선택 + 병원 필터 */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select style={sel} value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select style={sel} value={month} onChange={e => setMonth(Number(e.target.value))}>
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
        <span style={{ color: '#CCC', margin: '0 0.25rem' }}>|</span>
        <select style={{ ...sel, minWidth: '140px' }} value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}>
          <option value="all">🏥 전체 병원</option>
          {hospitalNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        {selectedHospital !== 'all' && (
          <button onClick={() => setSelectedHospital('all')} style={btnReset}>✕ 전체 보기</button>
        )}
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: '총 매출', value: `${fmt(totalAll.pay)}원`, color: '#2D5A3D', bg: '#E8F5E9' },
          { label: '총 근무시간', value: `${totalAll.hours}시간`, color: '#1565C0', bg: '#E3F2FD' },
          { label: '병원 수', value: `${totalAll.hospitals}곳`, color: '#E65100', bg: '#FFF3E0' },
          { label: '간병인', value: `${totalAll.caregivers}명`, color: '#6A1B9A', bg: '#F3E5F5' },
        ].map(card => (
          <div key={card.label} style={{ padding: '1rem', background: card.bg, borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 병원별 상세 + 차트 */}
      {summary.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          {records.length === 0 ? '📭 출퇴근 기록이 없습니다'
            : selectedHospital !== 'all' ? `📭 ${selectedHospital}의 ${year}년 ${month}월 기록이 없습니다`
            : `📭 ${year}년 ${month}월 기록이 없습니다`}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* 왼쪽: 병원별 상세 테이블 */}
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>
            {summary.map((h, i) => (
              <div key={h.hospitalName} style={{
                marginBottom: '1rem', border: '1px solid #E0E0E0', borderRadius: '0.75rem', overflow: 'hidden',
                background: i % 2 === 0 ? '#FAFAFA' : 'white',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
                  padding: '0.75rem 1.25rem', background: '#2D5A3D', color: 'white',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>🏥 {h.hospitalName}</div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
                    <span>👥 {h.caregiverCount}명</span>
                    <span>⏱ {h.totalHours}시간</span>
                    <span style={{ fontWeight: 700 }}>💰 {fmt(h.totalPay)}원</span>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#F5F5F5' }}>
                      <th style={th}>간병인</th>
                      <th style={th}>시급</th>
                      <th style={th}>근무일</th>
                      <th style={th}>시간</th>
                      <th style={th}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {h.details.map(d => (
                      <tr key={d.caregiverName}>
                        <td style={td}>{d.caregiverName}</td>
                        <td style={td}>{d.hourlyRate ? fmt(d.hourlyRate) : '-'}원</td>
                        <td style={td}>{d.days}일</td>
                        <td style={td}>{d.hours}시간</td>
                        <td style={{ ...td, fontWeight: 600, color: '#2D5A3D' }}>{fmt(d.pay)}원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* 오른쪽: 도넛 차트 */}
          {chartSegments.length > 0 && (
            <div className="no-print" style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem' }}>
              <svg viewBox="0 0 120 120" style={{ width: '260px', height: '260px' }}>
                {chartSegments.map(seg => (
                  <circle key={seg.name} cx="60" cy="60" r="38" fill="none"
                    stroke={seg.color} strokeWidth="16"
                    strokeDasharray={`${seg.dash} ${2 * Math.PI * 38 - seg.dash}`}
                    strokeDashoffset={-seg.offset}
                    transform="rotate(-90 60 60)"
                  />
                ))}
                <text x="60" y="56" textAnchor="middle" fontSize="8" fill="#888" fontWeight={600}>총 매출</text>
                <text x="60" y="68" textAnchor="middle" fontSize="11" fill="#2D5A3D" fontWeight={800}>{fmt(totalAll.pay)}원</text>
              </svg>
              <div style={{ marginTop: '1rem', width: '100%', maxHeight: '300px', overflowY: 'auto' }}>
                {chartData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', fontSize: '0.8125rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    <span style={{ fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>{fmt(d.value)}원</span>
                    <span style={{ fontSize: '0.75rem', color: '#999', whiteSpace: 'nowrap' }}>{(d.ratio * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 인쇄 */}
      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={() => window.print()} style={btnPrint}>🖨️ 리포트 인쇄</button>
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}

const sel: React.CSSProperties = { padding: '0.5rem 0.75rem', border: '1px solid #CCC', borderRadius: '0.5rem', fontSize: '0.9375rem', background: 'white' };
const th: React.CSSProperties = { padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#555', borderBottom: '1px solid #E0E0E0', fontSize: '0.75rem' };
const td: React.CSSProperties = { padding: '0.5rem 0.75rem', textAlign: 'center', borderBottom: '1px solid #F0F0F0' };
const btnReset: React.CSSProperties = { padding: '0.35rem 0.75rem', background: '#FFF', color: '#2D5A3D', border: '1px solid #2D5A3D', borderRadius: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 };
const btnPrint: React.CSSProperties = { padding: '0.75rem 2rem', background: '#2D5A3D', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
