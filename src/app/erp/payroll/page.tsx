'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { getCaregivers, type Caregiver } from '@/lib/caregiverStore';
import { useRole } from '@/lib/roleContext';

interface Attendance {
  id: string;
  caregiverId: string;
  caregiverName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
}

export default function PayrollPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [editRates, setEditRates] = useState<Record<string, number>>({});
  const [selectedCgId, setSelectedCgId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const role = useRole(); const isViewer = role === 'viewer';

  useEffect(() => {
    (async () => {
      try {
      const [cgList, snap] = await Promise.all([
        getCaregivers(),
        getDocs(query(collection(db, 'attendance'), orderBy('date', 'desc'))),
      ]);
      setCaregivers(cgList);
      const list: Attendance[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Attendance));
      setRecords(list);
      // 초기 시급 설정
      const rates: Record<string, number> = {};
      cgList.forEach(c => { rates[c.id] = c.hourlyRate || 0; });
      setEditRates(rates);
      } catch (e: any) {
        console.error('Payroll page load error:', e?.message);
      } finally {
      setLoading(false);
      }
    })();
  }, []);

  // 해당 월 출퇴근
  const monthPrefix = `${selYear}-${String(selMonth).padStart(2, '0')}`;
  const monthRecords = useMemo(() =>
    records.filter(r => r.date && r.date.startsWith(monthPrefix)),
    [records, monthPrefix]);

  // 간병인별 집계
  const payroll = useMemo(() => {
    const map: Record<string, { cg: Caregiver; days: number; hours: number }> = {};
    monthRecords.forEach(r => {
      const cg = caregivers.find(c => c.id === r.caregiverId);
      if (!cg) return;
      if (!map[r.caregiverId]) map[r.caregiverId] = { cg, days: 0, hours: 0 };
      map[r.caregiverId].days += 1;
      map[r.caregiverId].hours += r.totalHours || 0;
    });
    return Object.values(map).map(p => ({
      ...p,
      rate: editRates[p.cg.id] || 0,
      total: Math.round((editRates[p.cg.id] || 0) * p.hours),
    })).sort((a, b) => b.total - a.total);
  }, [monthRecords, caregivers, editRates]);

  // 요약
  const summary = useMemo(() => ({
    totalPay: payroll.reduce((s, p) => s + p.total, 0),
    totalHours: payroll.reduce((s, p) => s + p.hours, 0),
    people: payroll.length,
  }), [payroll]);

  const selCg = selectedCgId ? payroll.find(p => p.cg.id === selectedCgId) : null;
  const selCgRecords = useMemo(() =>
    selectedCgId ? monthRecords.filter(r => r.caregiverId === selectedCgId) : [],
    [monthRecords, selectedCgId]);

  const handlePrint = () => {
    document.title = `${selYear}년${selMonth}월_급여명세서`;
    window.print();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates = caregivers.map(cg =>
        updateDoc(doc(db, 'caregivers', cg.id), { hourlyRate: editRates[cg.id] || 0 })
      );
      await Promise.all(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('저장 실패: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  return (
    <div>
      {/* 월 선택 */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D5A3D', margin: 0 }}>💰 급여 정산</h2>
        <div style={{ flex: 1 }} />
        <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={sel}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} style={sel}>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
        </select>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: '총 급여', value: `${summary.totalPay.toLocaleString()}원`, color: '#2D5A3D' },
          { label: '총 근무시간', value: `${summary.totalHours}시간`, color: '#1565C0' },
          { label: '인원', value: `${summary.people}명`, color: '#E65100' },
          { label: '1인 평균', value: summary.people ? `${Math.round(summary.totalPay / summary.people).toLocaleString()}원` : '-', color: '#7B1FA2' },
        ].map(card => (
          <div key={card.label} style={{
            padding: '1rem', borderRadius: '0.75rem', background: 'white',
            border: `2px solid ${card.color}20`, textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 시급 일괄 설정 */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#FFF8E1', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>⏱️ 기본 시급</span>
        <input type="number" placeholder="예: 12000" style={inpSmall}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const v = Number((e.target as HTMLInputElement).value) || 0;
              const rates: Record<string, number> = {};
              caregivers.forEach(c => { rates[c.id] = v; });
              setEditRates(rates);
            }
          }}
        />
        <span style={{ fontSize: '0.75rem', color: '#888' }}>원 — Enter로 전체 적용, 아래 표에서 개별 수정</span>
        <div style={{ flex: 1 }} />
        <button onClick={handleSave} disabled={saving} style={{
          padding: '0.5rem 1.25rem', background: saved ? '#4CAF50' : '#2D5A3D',
          color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem',
          fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: '0.25rem',
        }}>
          {saving ? '⏳ 저장 중...' : saved ? '✅ 저장 완료!' : '💾 시급 저장'}
        </button>
      </div>

      {/* 간병인별 급여 테이블 */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#F5F5F5' }}>
              {['간병인', '근무일수', '총 근무시간', '시급', '총 급여', '상세'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.5rem', border: '1px solid #DDD', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payroll.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>📭 이번 달 출퇴근 기록이 없습니다</td></tr>
            ) : (
              payroll.map(p => (
                <tr key={p.cg.id} style={{ background: selectedCgId === p.cg.id ? '#F0F7F0' : '#fff' }}>
                  <td style={td2}>{p.cg.name}</td>
                  <td style={td2}>{p.days}일</td>
                  <td style={{ ...td2, fontWeight: 600 }}>{p.hours}시간</td>
                  <td style={td2}>
                    <input type="number" value={editRates[p.cg.id] || 0}
                      onChange={e => setEditRates(prev => ({ ...prev, [p.cg.id]: Number(e.target.value) || 0 }))}
                      style={{ width: '80px', padding: '0.25rem', border: '1px solid #CCC', borderRadius: '0.25rem', textAlign: 'center', fontSize: '0.85rem' }} />
                    원
                  </td>
                  <td style={{ ...td2, fontWeight: 800, color: '#2D5A3D', fontSize: '0.95rem' }}>
                    {p.total.toLocaleString()}원
                  </td>
                  <td style={td2}>
                    <button onClick={() => setSelectedCgId(selectedCgId === p.cg.id ? null : p.cg.id)} style={btnSm}>
                      {selectedCgId === p.cg.id ? '▲ 접기' : '📋'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 선택된 간병인 상세 명세서 */}
      {selCg && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '0.75rem', border: '2px solid #2D5A3D' }} className="payslip">
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={handlePrint} style={btn}>🖨️ 명세서 인쇄</button>
          </div>

          <h3 style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '0.1rem' }}>
            급 여 명 세 서
          </h3>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
            {selYear}년 {selMonth}월 · {selCg.cg.name}
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ background: '#F5F5F5' }}>
                {['날짜', '출근', '퇴근', '근무시간', '일급'].map(h => (
                  <th key={h} style={{ padding: '0.5rem', border: '1px solid #DDD', fontWeight: 700, textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selCgRecords.map(r => (
                <tr key={r.id}>
                  <td style={td2}>{r.date}</td>
                  <td style={td2}>{r.clockIn}시</td>
                  <td style={td2}>{r.clockOut}시</td>
                  <td style={td2}>{r.totalHours || 0}시간</td>
                  <td style={td2}>{Math.round((r.totalHours || 0) * selCg.rate).toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', paddingTop: '1rem', borderTop: '2px solid #333', fontWeight: 700, fontSize: '1rem' }}>
            <span>총 근무: {selCg.hours}시간</span>
            <span>시급: {selCg.rate.toLocaleString()}원</span>
            <span style={{ color: '#2D5A3D', fontSize: '1.1rem' }}>급여: {selCg.total.toLocaleString()}원</span>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right', fontSize: '0.85rem', color: '#888' }}>
            작성일: {new Date().toLocaleDateString('ko-KR')} · 다사랑 간병공동체
          </div>
        </div>
      )}

      <style jsx>{`@media print {
        html, body {
          background: white !important;
          background-image: none !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print { display: none !important; }
        .payslip { border: 2px solid #333 !important; padding: 10mm !important; }
        body { font-size: 12px; }
        table { font-size: 11px; }
      }`}</style>
    </div>
  );
}

const td2: React.CSSProperties = { padding: '0.5rem', border: '1px solid #DDD', textAlign: 'center', verticalAlign: 'middle' };
const sel: React.CSSProperties = { padding: '0.4rem 0.6rem', border: '1px solid #CCC', borderRadius: '0.4rem', fontSize: '0.85rem' };
const btn: React.CSSProperties = { padding: '0.5rem 1.2rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' };
const btnSm: React.CSSProperties = { padding: '0.25rem 0.5rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' };
const inpSmall: React.CSSProperties = { padding: '0.35rem 0.5rem', border: '1px solid #CCC', borderRadius: '0.3rem', fontSize: '0.85rem', width: '100px' };
