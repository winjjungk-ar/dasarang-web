'use client';

import { useState, useEffect } from 'react';
import { getCaregivers, updateCaregiver, type Caregiver, getHospitals, updateHospital, type Hospital } from '@/lib/caregiverStore';
import { useRole } from '@/lib/roleContext';

export default function ContractsPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'cg' | 'hosp'>('cg');
  const [saving, setSaving] = useState<string | null>(null);

  // 간병인 시급 수정
  const [editRate, setEditRate] = useState<Record<string, string>>({});

  // 병원 계약단가 수정
  const [editHospRate, setEditHospRate] = useState<Record<string, string>>({});
  const [editHospNotes, setEditHospNotes] = useState<Record<string, string>>({});
  const role = useRole(); const isViewer = role === 'viewer';

  useEffect(() => {
    (async () => {
      try {
      const [cgList, hospList] = await Promise.all([getCaregivers(), getHospitals()]);
      setCaregivers(cgList);
      setHospitals(hospList);
      const rates: Record<string, string> = {};
      cgList.forEach(c => { rates[c.id] = String(c.hourlyRate || 0); });
      setEditRate(rates);
      const hrs: Record<string, string> = {};
      const notes: Record<string, string> = {};
      hospList.forEach(h => { hrs[h.id] = String(h.contractRate || ''); notes[h.id] = h.contractNotes || ''; });
      setEditHospRate(hrs);
      setEditHospNotes(notes);
      } catch (e: any) {
        console.error('Contracts page load error:', e?.message);
      } finally {
      setLoading(false);
      }
    })();
  }, []);

  const handleSaveRate = async (cg: Caregiver) => {
    const newRate = Number(editRate[cg.id]) || 0;
    if (newRate === cg.hourlyRate) return;
    setSaving(cg.id);
    await updateCaregiver(cg.id, { hourlyRate: newRate });
    setCaregivers(prev => prev.map(c => c.id === cg.id ? { ...c, hourlyRate: newRate } : c));
    setSaving(null);
  };

  const handleSaveHosp = async (hosp: Hospital) => {
    const rate = Number(editHospRate[hosp.id]) || 0;
    const notes = editHospNotes[hosp.id] || '';
    setSaving(hosp.id);
    await updateHospital(hosp.id, { contractRate: rate || undefined, contractNotes: notes || undefined });
    setHospitals(prev => prev.map(h => h.id === hosp.id ? { ...h, contractRate: rate || undefined, contractNotes: notes || undefined } : h));
    setSaving(null);
  };

  const fmt = (n: number) => n ? n.toLocaleString() : '0';

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D5A3D', marginBottom: '1.5rem' }}>📝 계약·시급 관리</h2>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['cg', 'hosp'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none',
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
            background: tab === t ? '#2D5A3D' : '#E8F0E8', color: tab === t ? '#fff' : '#666',
          }}>{t === 'cg' ? '👩‍⚕️ 간병인 시급' : '🏥 병원 계약단가'}</button>
        ))}
      </div>

      {/* ── 간병인 시급 ── */}
      {tab === 'cg' && (
        <div>
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
            💡 시급을 변경하면 <strong>변경 이력이 자동 저장</strong>됩니다. 급여 정산 시 변경 전 기간에는 이전 시급이 적용됩니다.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F5F5F5' }}>
                  <th style={th}>간병인</th><th style={th}>현재 시급</th><th style={th}>새 시급</th><th style={th}>시급 변경 이력</th><th style={th}>저장</th>
                </tr>
              </thead>
              <tbody>
                {caregivers.map(cg => (
                  <tr key={cg.id}>
                    <td style={{...td, fontWeight:600}}>{cg.name}</td>
                    <td style={{...td, color:'#2D5A3D', fontWeight:700}}>{fmt(cg.hourlyRate)}원</td>
                    <td style={td}>
                      <input type="number" value={editRate[cg.id] || ''}
                        onChange={e => setEditRate(prev => ({...prev, [cg.id]: e.target.value}))}
                        style={{ width:'100px', padding:'0.35rem', border:'1px solid #CCC', borderRadius:'0.25rem', textAlign:'center', fontSize:'0.85rem' }} /> 원
                    </td>
                    <td style={td}>
                      {cg.rateHistory && cg.rateHistory.length > 0 ? (
                        <div style={{ textAlign: 'left', fontSize: '0.75rem', color: '#888' }}>
                          {cg.rateHistory.slice(-5).reverse().map((h, i) => (
                            <div key={i}>{h.effectiveDate}: {fmt(h.rate)}원</div>
                          ))}
                        </div>
                      ) : <span style={{ color: '#CCC' }}>변경 이력 없음</span>}
                    </td>
                    <td style={td}>
                      <button onClick={() => handleSaveRate(cg)} disabled={saving === cg.id || Number(editRate[cg.id]) === cg.hourlyRate}
                        style={{
                          ...btnSm, opacity: (saving === cg.id || Number(editRate[cg.id]) === cg.hourlyRate) ? 0.5 : 1,
                          cursor: (saving === cg.id || Number(editRate[cg.id]) === cg.hourlyRate) ? 'not-allowed' : 'pointer',
                        }}>{saving === cg.id ? '...' : '💾 저장'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 병원 계약단가 ── */}
      {tab === 'hosp' && (
        <div>
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
            💡 병원별 계약단가를 등록하면 <strong>청구서 발행 시 이 단가로 계산</strong>됩니다. (미설정 시 간병인 시급 기준)
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F5F5F5' }}>
                  <th style={th}>병원</th><th style={th}>계약단가 (원)</th><th style={th}>비고</th><th style={th}>저장</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map(hosp => (
                  <tr key={hosp.id}>
                    <td style={{...td, fontWeight:600}}>{hosp.name}</td>
                    <td style={td}>
                      <input type="number" value={editHospRate[hosp.id] || ''}
                        onChange={e => setEditHospRate(prev => ({...prev, [hosp.id]: e.target.value}))}
                        placeholder="미설정"
                        style={{ width:'100px', padding:'0.35rem', border:'1px solid #CCC', borderRadius:'0.25rem', textAlign:'center', fontSize:'0.85rem' }} /> 원
                    </td>
                    <td style={td}>
                      <input value={editHospNotes[hosp.id] || ''}
                        onChange={e => setEditHospNotes(prev => ({...prev, [hosp.id]: e.target.value}))}
                        placeholder="계약 특이사항"
                        style={{ width:'100%', maxWidth:'200px', padding:'0.35rem', border:'1px solid #CCC', borderRadius:'0.25rem', fontSize:'0.8rem' }} />
                    </td>
                    <td style={td}>
                      <button onClick={() => handleSaveHosp(hosp)} disabled={saving === hosp.id}
                        style={{...btnSm, opacity: saving === hosp.id ? 0.5 : 1}}>
                        {saving === hosp.id ? '...' : '💾 저장'}
                      </button>
                    </td>
                  </tr>
                ))}
                {hospitals.length === 0 && (
                  <tr><td colSpan={4} style={{ padding:'2rem', textAlign:'center', color:'#999' }}>등록된 병원이 없습니다</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding:'0.6rem 0.5rem',border:'1px solid #DDD',fontWeight:700,textAlign:'center',whiteSpace:'nowrap',fontSize:'0.8rem' };
const td: React.CSSProperties = { padding:'0.5rem',border:'1px solid #EEE',textAlign:'center',verticalAlign:'middle' };
const btnSm: React.CSSProperties = { padding:'0.35rem 0.75rem',background:'#2D5A3D',color:'#fff',border:'none',borderRadius:'0.3rem',fontSize:'0.8rem',fontWeight:600 };
