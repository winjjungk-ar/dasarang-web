'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { useRole } from '@/lib/roleContext';
import { getCaregivers, getHospitals, getPatients, type Caregiver, type Hospital, type Patient } from '@/lib/caregiverStore';

interface Schedule {
  id: string;
  caregiverId: string;
  caregiverName: string;
  hospitalName: string;
  patientName: string;
  startDate: string;
  endDate: string;
  shift: 'day' | 'night' | '24h';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
}

const SHIFT_LABELS: Record<string, string> = { day: '☀️ 주간', night: '🌙 야간', '24h': '🔁 24시간' };
const STATUS_LABELS: Record<string, string> = { scheduled: '📅 예정', 'in-progress': '🟢 진행중', completed: '✅ 완료', cancelled: '❌ 취소' };
const STATUS_COLORS: Record<string, string> = { scheduled: '#1565C0', 'in-progress': '#2D5A3D', completed: '#888', cancelled: '#C62828' };

export default function SchedulePage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터
  const [viewMode, setViewMode] = useState<'upcoming' | 'all' | 'calendar'>('upcoming');
  const [selectedCgId, setSelectedCgId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    caregiverId: '', caregiverName: '', hospitalName: '',
    patientName: '', startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    shift: 'day' as 'day' | 'night' | '24h',
    status: 'scheduled' as Schedule['status'],
    notes: '',
  });
  const [conflictMsg, setConflictMsg] = useState('');
  const role = useRole(); const isViewer = role === 'viewer';

  useEffect(() => {
    (async () => {
      try {
      const [cgList, hospList, patList, snap] = await Promise.all([
        getCaregivers(), getHospitals(), getPatients(),
        getDocs(query(collection(db, 'schedules'), orderBy('startDate', 'desc'))),
      ]);
      setCaregivers(cgList);
      setHospitals(hospList);
      setPatients(patList);
      const list: Schedule[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Schedule));
      setSchedules(list);
      } catch (e: any) {
        console.error('Schedule page load error:', e?.message);
      } finally {
      setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = schedules;
    const today = new Date().toISOString().split('T')[0];

    if (viewMode === 'upcoming') {
      result = result.filter(s => s.endDate >= today && s.status !== 'cancelled');
    }
    if (selectedCgId) result = result.filter(s => s.caregiverId === selectedCgId);
    if (selectedStatus) result = result.filter(s => s.status === selectedStatus);
    return result;
  }, [schedules, viewMode, selectedCgId, selectedStatus]);

  // 중복 배정 체크
  const checkConflict = (cgId: string, start: string, end: string, excludeId?: string): Schedule | null => {
    return schedules.find(s => {
      if (s.caregiverId !== cgId) return false;
      if (s.status === 'cancelled') return false;
      if (excludeId && s.id === excludeId) return false;
      return !(end < s.startDate || start > s.endDate);
    }) || null;
  };

  const handleSave = async () => {
    if (!form.caregiverId || !form.startDate) return;

    const conflict = checkConflict(form.caregiverId, form.startDate, form.endDate, editId || undefined);
    if (conflict) {
      setConflictMsg(`⚠️ ${conflict.caregiverName}님은 ${conflict.startDate}~${conflict.endDate} 이미 ${conflict.hospitalName}에 배정되어 있습니다!`);
      return;
    }
    setConflictMsg('');

    const data = {
      ...form,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, 'schedules', editId), data as any);
      } else {
        await addDoc(collection(db, 'schedules'), data);
      }
      setShowModal(false);
      setEditId(null);
      const snap = await getDocs(query(collection(db, 'schedules'), orderBy('startDate', 'desc')));
      const list: Schedule[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Schedule));
      setSchedules(list);
    } catch (e) {
      alert('저장 실패');
    }
  };

  const handleEdit = (s: Schedule) => {
    setEditId(s.id);
    setForm({ caregiverId: s.caregiverId, caregiverName: s.caregiverName, hospitalName: s.hospitalName, patientName: s.patientName || '', startDate: s.startDate, endDate: s.endDate, shift: s.shift, status: s.status, notes: s.notes || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 배차를 삭제할까요?')) return;
    await deleteDoc(doc(db, 'schedules', id));
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const openNew = (cg?: Caregiver) => {
    setEditId(null);
    setForm({
      caregiverId: cg?.id || '', caregiverName: cg?.name || '',
      hospitalName: '', patientName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      shift: 'day', status: 'scheduled', notes: '',
    });
    setConflictMsg('');
    setShowModal(true);
  };

  const cgSchedules = useMemo(() => {
    const map: Record<string, number> = {};
    const today = new Date().toISOString().split('T')[0];
    schedules.forEach(s => {
      if (s.status === 'cancelled') return;
      if (s.endDate >= today) {
        map[s.caregiverId] = (map[s.caregiverId] || 0) + 1;
      }
    });
    return map;
  }, [schedules]);

  // 이번주 배차 현황
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }, []);
  const weekSchedules = useMemo(() =>
    schedules.filter(s => s.startDate >= weekStart && s.status !== 'cancelled'),
    [schedules, weekStart]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D5A3D', margin: 0 }}>📋 배차·스케줄 관리</h2>
        <div style={{ flex: 1 }} />
        {(['upcoming', 'all'] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={{
            padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
            background: viewMode === m ? '#2D5A3D' : '#E8F0E8', color: viewMode === m ? '#fff' : '#555',
          }}>{m === 'upcoming' ? '📅 예정/진행' : '📋 전체'}</button>
        ))}
        <button onClick={() => openNew()} style={btnPrimary}>➕ 새 배차</button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: '이번주 배차', value: `${weekSchedules.length}건`, color: '#2D5A3D', bg: '#E8F5E9' },
          { label: '진행중', value: `${schedules.filter(s => s.status === 'in-progress').length}건`, color: '#1565C0', bg: '#E3F2FD' },
          { label: '예정', value: `${schedules.filter(s => s.status === 'scheduled' && s.startDate >= new Date().toISOString().split('T')[0]).length}건`, color: '#E65100', bg: '#FFF3E0' },
          { label: '배정 간병인', value: `${Object.keys(cgSchedules).length}명`, color: '#6A1B9A', bg: '#F3E5F5' },
        ].map(card => (
          <div key={card.label} style={{ padding: '1rem', background: card.bg, borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 간병인 필터 칩 */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem' }}>
          👩‍⚕️ 간병인 필터 — {selectedCgId ? `${caregivers.find(c => c.id === selectedCgId)?.name || ''}만 표시` : `전체 ${caregivers.length}명`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto' }}>
          {selectedCgId && (
            <button onClick={() => setSelectedCgId('')} style={chipStyle('#888')}>✕ 전체</button>
          )}
          {caregivers.map(cg => (
            <button key={cg.id} onClick={() => setSelectedCgId(cg.id)} style={chipStyle(selectedCgId === cg.id ? '#2D5A3D' : '#CCC')}>
              {cg.name} {cgSchedules[cg.id] ? `(${cgSchedules[cg.id]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* 배차 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#F5F5F5' }}>
              {['기간', '간병인', '병원', '환자', '근무', '상태', '비고', '관리'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>📭 배차가 없습니다</td></tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} style={{
                  background: s.status === 'in-progress' ? '#F0F7F0' : s.status === 'cancelled' ? '#FFF5F5' : '#fff',
                }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{s.startDate}</div>
                    {s.startDate !== s.endDate && <div style={{ fontSize: '0.75rem', color: '#888' }}>~{s.endDate}</div>}
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{s.caregiverName}</td>
                  <td style={td}>{s.hospitalName || '-'}</td>
                  <td style={td}>{s.patientName || '-'}</td>
                  <td style={td}>{SHIFT_LABELS[s.shift] || s.shift}</td>
                  <td style={td}>
                    <span style={{
                      padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                      background: STATUS_COLORS[s.status] + '18', color: STATUS_COLORS[s.status],
                      fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap',
                    }}>{STATUS_LABELS[s.status]}</span>
                  </td>
                  <td style={{ ...td, color: '#888', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes || '-'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button onClick={() => handleEdit(s)} style={btnSm}>✏️</button>
                      <button onClick={() => handleDelete(s.id)} style={{ ...btnSm, background: '#C62828' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {showModal && (
        <div style={modalBg} onClick={() => setShowModal(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.25rem', color: '#2D5A3D' }}>{editId ? '✏️ 배차 수정' : '➕ 새 배차 등록'}</h3>

            {conflictMsg && (
              <div style={{
                padding: '0.75rem', marginBottom: '1rem',
                background: '#FFEBEE', borderRadius: '0.5rem',
                color: '#C62828', fontWeight: 600, fontSize: '0.85rem',
                border: '2px solid #C62828',
              }}>{conflictMsg}</div>
            )}

            <div style={formGrid}>
              <div>
                <label style={lbl}>간병인 *</label>
                <select style={inp} value={form.caregiverId} onChange={e => {
                  const cg = caregivers.find(c => c.id === e.target.value);
                  setForm({ ...form, caregiverId: e.target.value, caregiverName: cg?.name || '' });
                }}>
                  <option value="">선택</option>
                  {caregivers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>병원</label>
                <input style={inp} value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} placeholder="병원명" list="hosp-list" />
                <datalist id="hosp-list">{hospitals.map(h => <option key={h.id} value={h.name} />)}</datalist>
              </div>
              <div>
                <label style={lbl}>환자 (선택)</label>
                <input style={inp} value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} placeholder="환자명" list="pat-list" />
                <datalist id="pat-list">{patients.map(p => <option key={p.id} value={p.patientName} />)}</datalist>
              </div>
              <div>
                <label style={lbl}>시작일</label>
                <input type="date" style={inp} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>종료일</label>
                <input type="date" style={inp} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>근무</label>
                <select style={inp} value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value as any })}>
                  {Object.entries(SHIFT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>상태</label>
                <select style={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>비고</label>
                <input style={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="특이사항" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button onClick={handleSave} style={{ ...btnPrimary, flex: 1 }}>저장</button>
              <button onClick={() => { setShowModal(false); setEditId(null); setConflictMsg(''); }} style={{ ...btnPrimary, background: '#999', flex: 1 }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 인쇄 CSS */}
      <style jsx>{`@media print {
        html, body { background: white !important; background-image: none !important; }
        .no-print, button, input, textarea, select { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { font-size: 10px; }
        table { font-size: 9px; }
      }`}</style>
    </div>
  );
}

const chipStyle = (color: string): React.CSSProperties => ({
  padding: '0.35rem 0.75rem', borderRadius: '2rem',
  border: color === '#2D5A3D' ? '2px solid #2D5A3D' : '1px solid #CCC',
  background: color === '#2D5A3D' ? '#2D5A3D' : color === '#888' ? '#EEE' : 'white',
  color: color === '#2D5A3D' ? 'white' : color === '#888' ? '#555' : '#555',
  fontSize: '0.8rem', fontWeight: color === '#2D5A3D' ? 700 : 400,
  cursor: 'pointer', whiteSpace: 'nowrap',
});

const th: React.CSSProperties = { padding: '0.6rem 0.5rem', border: '1px solid #DDD', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.8rem' };
const td: React.CSSProperties = { padding: '0.5rem', border: '1px solid #EEE', textAlign: 'center', verticalAlign: 'middle' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: '0.25rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #CCC', borderRadius: '0.4rem', fontSize: '0.9rem', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { padding: '0.5rem 1.25rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' };
const btnSm: React.CSSProperties = { padding: '0.25rem 0.5rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' };
const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' };
const modalBg: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox: React.CSSProperties = { background: 'white', borderRadius: '1rem', padding: '2rem', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto' };
