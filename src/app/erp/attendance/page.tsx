'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getCaregivers, getHospitals, type Caregiver, type Hospital } from '@/lib/caregiverStore';
import { useRole } from '@/lib/roleContext';

interface Attendance {
  id: string;
  caregiverId: string;
  caregiverName: string;
  hospitalName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  createdAt: string;
}

export default function AttendancePage() {
  const [tab, setTab] = useState<'records' | 'stats'>('records');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터 — 기록탭 + 통계탭 공유
  const [selectedCgId, setSelectedCgId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 추가/수정 모달
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    caregiverId: '', caregiverName: '', hospitalName: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '09', clockOut: '18',
  });

  // 통계 기준
  const [statsMode, setStatsMode] = useState<'daily' | 'monthly' | 'quarterly'>('monthly');
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth() + 1);
  const [statsQuarter, setStatsQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const role = useRole(); const isViewer = role === 'viewer';

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
    const [cgList, hospList, snap] = await Promise.all([
      getCaregivers(),
      getHospitals(),
      getDocs(query(collection(db, 'attendance'), orderBy('date', 'desc'))),
    ]);
    setCaregivers(cgList);
    setHospitals(hospList);
    const list: Attendance[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Attendance));
    setRecords(list);
    } catch (e: any) {
      console.error('Attendance page load error:', e?.message);
    } finally {
    setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 필터링된 기록
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (selectedCgId && r.caregiverId !== selectedCgId) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }, [records, selectedCgId, dateFrom, dateTo]);

  // 시간 계산
  const calcHours = (cin: string, cout: string) => {
    if (!cin || !cout) return 0;
    let h = parseInt(cout) - parseInt(cin);
    if (h < 0) h += 24;
    return h;
  };

  // 저장
  const handleSave = async () => {
    const hours = calcHours(form.clockIn, form.clockOut);
    if (!form.caregiverId || !form.date) return;
    const data = { ...form, totalHours: hours, createdAt: new Date().toISOString() };

    if (editId) {
      await updateDoc(doc(db, 'attendance', editId), data as any);
    } else {
      await addDoc(collection(db, 'attendance'), data as any);
    }
    setShowModal(false);
    setEditId(null);
    await loadData();
  };

  const handleEdit = (r: Attendance) => {
    setEditId(r.id);
    setForm({ caregiverId: r.caregiverId, caregiverName: r.caregiverName, hospitalName: r.hospitalName || '', date: r.date, clockIn: r.clockIn, clockOut: r.clockOut });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 출퇴근 기록을 삭제할까요?')) return;
    await deleteDoc(doc(db, 'attendance', id));
    await loadData();
  };

  // 통계 계산 (간병인 필터 적용)
  const stats = useMemo(() => {
    let base = records;
    if (selectedCgId) base = base.filter(r => r.caregiverId === selectedCgId);

    return base.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      if (d.getFullYear() !== statsYear) return false;
      if (statsMode === 'monthly') return d.getMonth() + 1 === statsMonth;
      if (statsMode === 'quarterly') return Math.ceil((d.getMonth() + 1) / 3) === statsQuarter;
      if (statsMode === 'daily') return r.date >= (dateFrom || `${statsYear}-01-01`) && r.date <= (dateTo || `${statsYear}-12-31`);
      return true;
    });
  }, [records, selectedCgId, statsMode, statsYear, statsMonth, statsQuarter, dateFrom, dateTo]);

  const caregiverStats = useMemo(() => {
    const map: Record<string, { name: string; hours: number; days: number }> = {};
    stats.forEach(r => {
      if (!map[r.caregiverId]) map[r.caregiverId] = { name: r.caregiverName, hours: 0, days: 0 };
      map[r.caregiverId].hours += r.totalHours || 0;
      map[r.caregiverId].days += 1;
    });
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [stats]);

  const totalStats = useMemo(() => ({
    hours: caregiverStats.reduce((s, c) => s + c.hours, 0),
    days: caregiverStats.reduce((s, c) => s + c.days, 0),
    people: caregiverStats.length,
  }), [caregiverStats]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const handleCgClick = (id: string) => setSelectedCgId(prev => prev === id ? '' : id);

  // QR 코드 URL 생성
  const getCheckinUrl = (cgId: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/checkin?cg=${cgId}`;
  };

  const selectedCg = caregivers.find(c => c.id === selectedCgId);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  // 간병인 필터 칩 (기록탭 + 통계탭 공용)
  const CgFilterChips = () => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem' }}>
        👩‍⚕️ 간병인 필터 (클릭 토글) — {selectedCgId ? `${selectedCg?.name || ''}만 표시 중` : `전체 ${caregivers.length}명`}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto' }}>
        {caregivers.map(cg => (
          <button key={cg.id} onClick={() => handleCgClick(cg.id)} style={{
            padding: '0.35rem 0.75rem', borderRadius: '2rem', border: selectedCgId === cg.id ? '2px solid #2D5A3D' : '1px solid #CCC',
            background: selectedCgId === cg.id ? '#2D5A3D' : 'white',
            color: selectedCgId === cg.id ? 'white' : '#555',
            fontSize: '0.8rem', fontWeight: selectedCgId === cg.id ? 700 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {cg.name}
          </button>
        ))}
        {caregivers.length === 0 && <span style={{ color: '#999', fontSize: '0.85rem' }}>등록된 간병인이 없습니다. 먼저 간병인을 등록해주세요.</span>}
      </div>
      {/* QR 체크인 링크 */}
      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span>
          📱 <a href="/checkin" target="_blank" style={{ color: '#2D5A3D', fontWeight: 600 }}>간병인용 체크인 페이지</a> —
          간병인 핸드폰에서 접속해 출퇴근 버튼 누르면 자동 기록됩니다
        </span>
        <a href="/checkin/poster" target="_blank" style={{
          padding: '0.3rem 0.75rem', background: '#FFF9C4', color: '#F57F17',
          borderRadius: '0.3rem', textDecoration: 'none', fontWeight: 700,
          fontSize: '0.78rem', whiteSpace: 'nowrap', border: '1px solid #F57F17',
        }}>
          🏥 QR 포스터 인쇄
        </a>
      </div>
    </div>
  );

  return (
    <div>
      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {(['records', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none',
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
            background: tab === t ? '#2D5A3D' : '#E8F0E8', color: tab === t ? '#fff' : '#666',
          }}>
            {t === 'records' ? '⏱️ 출퇴근 기록' : '📊 통계'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => {
          const csv = ['날짜,간병인,병원,출근,퇴근,근무시간'].concat(
            records.map(r => [r.date, r.caregiverName, r.hospitalName, r.clockIn, r.clockOut, r.totalHours].join(','))
          ).join('\\n');
          const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`; a.click();
          URL.revokeObjectURL(url);
        }} style={{
          padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #2D5A3D',
          background: 'white', color: '#2D5A3D', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        }}>📥 CSV 다운로드</button>
      </div>

      {/* 간병인 필터 칩 (공통) */}
      <CgFilterChips />

      {/* ────── 출퇴근 기록 탭 ────── */}
      {tab === 'records' && (
        <>
          {/* 선택된 간병인 체크인 링크 */}
          {selectedCgId && selectedCg && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#F0F7F0', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.85rem', flex: 1 }}>
                <strong>{selectedCg.name}</strong> 님 체크인 링크<br />
                <span style={{ fontSize: '0.78rem', background: '#E8F0E8', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px', display: 'inline-block', fontFamily: 'monospace' }}>{getCheckinUrl(selectedCgId)}</span><br />
                <span style={{ color: '#888', fontSize: '0.7rem' }}>복사해서 간병인에게 공유하세요</span>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(getCheckinUrl(selectedCgId)); alert('복사됨!'); }} style={{ ...btnSm, whiteSpace: 'nowrap' }}>📋 복사</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>기간</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inpSmall} />
            <span>~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inpSmall} />
            <div style={{ flex: 1 }} />
            <button onClick={() => { setEditId(null); setForm({ caregiverId: selectedCgId, caregiverName: selectedCg?.name || '', hospitalName: '', date: new Date().toISOString().split('T')[0], clockIn: '09', clockOut: '18' }); setShowModal(true); }} style={btn} disabled={isViewer}>
             ➕ 출퇴근 기록 추가
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F5F5F5' }}>
                  {['날짜', '간병인', '병원', '출근', '퇴근', '근무시간', '관리'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.5rem', border: '1px solid #DDD', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>📭 기록이 없습니다</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} style={{ background: '#fff' }}>
                      <td style={td2}>{r.date}</td>
                      <td style={td2}>{r.caregiverName}</td>
                      <td style={td2}>{r.hospitalName || '-'}</td>
                      <td style={{ ...td2, color: '#2D5A3D', fontWeight: 600 }}>{r.clockIn}시</td>
                      <td style={{ ...td2, color: '#C62828', fontWeight: 600 }}>{r.clockOut}시</td>
                      <td style={{ ...td2, fontWeight: 700 }}>{r.totalHours || 0}시간</td>
                      <td style={td2}>
                        <button onClick={() => handleEdit(r)} style={btnSm} disabled={isViewer}>✏️</button>
                        <button onClick={() => handleDelete(r.id)} style={{ ...btnSm, background: '#C62828', marginLeft: '4px' }} disabled={isViewer}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#888', textAlign: 'right' }}>
            총 {filtered.length}건 / {filtered.reduce((s, r) => s + (r.totalHours || 0), 0)}시간
          </div>
        </>
      )}

      {/* ────── 통계 탭 ────── */}
      {tab === 'stats' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {(['daily', 'monthly', 'quarterly'] as const).map(m => (
              <button key={m} onClick={() => setStatsMode(m)} style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                background: statsMode === m ? '#2D5A3D' : '#E8F0E8', color: statsMode === m ? '#fff' : '#555',
              }}>
                {m === 'daily' ? '📅 일별' : m === 'monthly' ? '📆 월별' : '📊 분기별'}
              </button>
            ))}
            <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))} style={inpSmall}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            {statsMode === 'monthly' && (
              <select value={statsMonth} onChange={e => setStatsMonth(Number(e.target.value))} style={inpSmall}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
              </select>
            )}
            {statsMode === 'quarterly' && (
              <select value={statsQuarter} onChange={e => setStatsQuarter(Number(e.target.value))} style={inpSmall}>
                {[1, 2, 3, 4].map(q => <option key={q} value={q}>{q}분기</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: '총 근무시간', value: `${totalStats.hours}시간`, color: '#2D5A3D' },
              { label: '근무일수', value: `${totalStats.days}일`, color: '#1565C0' },
              { label: '인원', value: `${totalStats.people}명`, color: '#E65100' },
              { label: '1인 평균', value: totalStats.people ? `${Math.round(totalStats.hours / totalStats.people)}시간` : '-', color: '#7B1FA2' },
            ].map(card => (
              <div key={card.label} style={{
                padding: '1.25rem', borderRadius: '0.75rem', background: 'white',
                border: `2px solid ${card.color}20`, textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>{card.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F5F5F5' }}>
                  {['순위', '간병인', '총 근무시간', '근무일수', '일평균'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.5rem', border: '1px solid #DDD', fontWeight: 700, textAlign: 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caregiverStats.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>📭 해당 기간에 기록이 없습니다</td></tr>
                ) : (
                  caregiverStats.map((cg, i) => (
                    <tr key={i}>
                      <td style={td2}>{i + 1}</td>
                      <td style={{ ...td2, fontWeight: 600 }}>{cg.name}</td>
                      <td style={{ ...td2, fontWeight: 700, color: '#2D5A3D' }}>{cg.hours}시간</td>
                      <td style={td2}>{cg.days}일</td>
                      <td style={td2}>{Math.round(cg.hours / cg.days * 10) / 10}시간</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ────── 추가/수정 모달 ────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'white', borderRadius: '1rem', padding: '2rem',
            maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editId ? '✏️ 기록 수정' : '➕ 출퇴근 기록 추가'}</h3>
            <div style={formGrid}>
              <div>
                <label style={fl}>간병인</label>
                <select style={fi} value={form.caregiverId} onChange={e => {
                  const cg = caregivers.find(c => c.id === e.target.value);
                  setForm({ ...form, caregiverId: e.target.value, caregiverName: cg?.name || '' });
                }}>
                  <option value="">선택</option>
                  {caregivers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={fl}>병원</label>
                <input style={fi} value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} placeholder="병원명 입력" list="hosp-list" />
                <datalist id="hosp-list">
                  {hospitals.map(h => <option key={h.id} value={h.name} />)}
                </datalist>
              </div>
              <div>
                <label style={fl}>날짜</label>
                <input type="date" style={fi} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label style={fl}>출근</label>
                <select style={fi} value={form.clockIn} onChange={e => setForm({ ...form, clockIn: e.target.value })}>
                  {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                </select>
              </div>
              <div>
                <label style={fl}>퇴근</label>
                <select style={fi} value={form.clockOut} onChange={e => setForm({ ...form, clockOut: e.target.value })}>
                  {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button onClick={handleSave} style={{ ...btn, flex: 1 }} disabled={isViewer || !form.caregiverId || !form.hospitalName || !form.date}>저장</button>
              <button onClick={() => { setShowModal(false); setEditId(null); }} style={{ ...btn, background: '#999', flex: 1 }}>취소</button>
              {editId && <button onClick={() => { handleDelete(editId); setShowModal(false); setEditId(null); }} style={{ ...btn, background: '#C62828', flex: 1 }} disabled={isViewer}>삭제</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td2: React.CSSProperties = { padding: '0.5rem 0.5rem', border: '1px solid #DDD', textAlign: 'center', verticalAlign: 'middle' };
const btn: React.CSSProperties = { padding: '0.6rem 1.5rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
const btnSm: React.CSSProperties = { padding: '0.25rem 0.5rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' };
const inpSmall: React.CSSProperties = { padding: '0.4rem 0.6rem', border: '1px solid #CCC', borderRadius: '0.4rem', fontSize: '0.85rem' };
const fl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.25rem' };
const fi: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #CCC', borderRadius: '0.4rem', fontSize: '0.9rem', boxSizing: 'border-box' };
const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' };
