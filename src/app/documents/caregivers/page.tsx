'use client';

import { useState, useEffect } from 'react';
import { getCaregivers, saveCaregiver, updateCaregiver, deleteCaregiver, type Caregiver,
         getHospitals, saveHospital, updateHospital, deleteHospital, type Hospital } from '@/lib/caregiverStore';

export default function CaregiverPage() {
  const [tab, setTab] = useState<'cg' | 'hosp'>('cg');

  // Caregiver
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [cgName, setCgName] = useState(''); const [cgPhone, setCgPhone] = useState('');
  const [cgBirth, setCgBirth] = useState(''); const [cgRegNum, setCgRegNum] = useState('');
  const [cgPosition, setCgPosition] = useState('');
  const [cgJoinDate, setCgJoinDate] = useState('');
  const [editCgId, setEditCgId] = useState<string | null>(null);

  // Hospital
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospName, setHospName] = useState(''); const [editHospId, setEditHospId] = useState<string | null>(null);

  useEffect(() => { setCaregivers(getCaregivers()); setHospitals(getHospitals()); }, []);

  // Caregiver actions
  const saveCg = () => {
    if (!cgName.trim()) return;
    if (editCgId) updateCaregiver(editCgId, { name: cgName.trim(), phone: cgPhone.trim(), birth: cgBirth, regNum: cgRegNum.trim(), position: cgPosition, joinDate: cgJoinDate });
    else saveCaregiver({ name: cgName.trim(), phone: cgPhone.trim(), birth: cgBirth, regNum: cgRegNum.trim(), position: cgPosition, joinDate: cgJoinDate });
    setCgName(''); setCgPhone(''); setCgBirth(''); setCgRegNum(''); setCgPosition(''); setCgJoinDate(''); setEditCgId(null);
    setCaregivers(getCaregivers());
  };
  const editCg = (cg: Caregiver) => { setCgName(cg.name); setCgPhone(cg.phone); setCgBirth(cg.birth); setCgRegNum(cg.regNum || ''); setCgPosition(cg.position || ''); setCgJoinDate(cg.joinDate || ''); setEditCgId(cg.id); setTab('cg'); };
  const delCg = (id: string) => { if (confirm('삭제?')) { deleteCaregiver(id); setCaregivers(getCaregivers()); } };

  // Hospital actions
  const saveHosp = () => {
    if (!hospName.trim()) return;
    if (editHospId) updateHospital(editHospId, { name: hospName.trim() });
    else saveHospital({ name: hospName.trim() });
    setHospName(''); setEditHospId(null);
    setHospitals(getHospitals());
  };
  const editHosp = (h: Hospital) => { setHospName(h.name); setEditHospId(h.id); setTab('hosp'); };
  const delHosp = (id: string) => { if (confirm('삭제?')) { deleteHospital(id); setHospitals(getHospitals()); } };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '1rem' }}>
      <h2 style={{ color: '#4A7C59', marginBottom: '1rem' }}>👩‍⚕️ 간병인·병원 관리</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button onClick={() => setTab('cg')} style={{ ...tabBtn, background: tab === 'cg' ? '#4A7C59' : '#E0E8E0', color: tab === 'cg' ? 'white' : '#666' }}>👩‍⚕️ 간병인</button>
        <button onClick={() => setTab('hosp')} style={{ ...tabBtn, background: tab === 'hosp' ? '#4A7C59' : '#E0E8E0', color: tab === 'hosp' ? 'white' : '#666' }}>🏥 병원</button>
      </div>

      {/* Caregiver Tab */}
      {tab === 'cg' && (
        <>
          <div style={{ padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0', marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#4A7C59', marginBottom: '0.75rem' }}>{editCgId ? '✏️ 수정' : '➕ 새 간병인'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div><label style={lbl}>성명 *</label><input style={inp} value={cgName} onChange={e => setCgName(e.target.value)} /></div>
              <div><label style={lbl}>연락처</label><input style={inp} value={cgPhone} onChange={e => setCgPhone(e.target.value)} placeholder="010-0000-0000" /></div>
              <div><label style={lbl}>생년월일</label><input type="date" style={inp} value={cgBirth} onChange={e => setCgBirth(e.target.value)} /></div>
              <div><label style={lbl}>주민등록번호</label><input style={inp} value={cgRegNum} onChange={e => setCgRegNum(e.target.value)} placeholder="000000-0000000" /></div>
              <div><label style={lbl}>직위</label><input style={inp} value={cgPosition} onChange={e => setCgPosition(e.target.value)} placeholder="예: 간병인, 팀장" /></div>
              <div><label style={lbl}>입사일</label><input type="date" style={inp} value={cgJoinDate} onChange={e => setCgJoinDate(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={saveCg} style={btn}>{editCgId ? '저장' : '등록'}</button>
              {editCgId && <button onClick={() => { setEditCgId(null); setCgName(''); setCgPhone(''); setCgBirth(''); setCgRegNum(''); setCgPosition(''); }} style={{ ...btn, background: '#999' }}>취소</button>}
            </div>
          </div>
          {caregivers.length === 0 ? <p style={{ textAlign: 'center', color: '#999' }}>등록된 간병인 없음</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {caregivers.map(cg => (
                <div key={cg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.875rem 1rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #E0E8E0' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <strong style={{ fontSize: '1rem', color: '#4A7C59' }}>{cg.name}</strong>
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.875rem', color: '#666' }}>📞 {cg.phone || '-'} 🎂 {cg.birth || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => editCg(cg)} style={btnSm}>수정</button>
                    <button onClick={() => delCg(cg.id)} style={{ ...btnSm, background: '#C62828' }}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Hospital Tab */}
      {tab === 'hosp' && (
        <>
          <div style={{ padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0', marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#4A7C59', marginBottom: '0.75rem' }}>{editHospId ? '✏️ 수정' : '➕ 새 병원'}</h4>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}><label style={lbl}>병원명 *</label><input style={inp} value={hospName} onChange={e => setHospName(e.target.value)} /></div>
              <button onClick={saveHosp} style={btn}>{editHospId ? '저장' : '등록'}</button>
              {editHospId && <button onClick={() => { setEditHospId(null); setHospName(''); }} style={{ ...btn, background: '#999' }}>취소</button>}
            </div>
          </div>
          {hospitals.length === 0 ? <p style={{ textAlign: 'center', color: '#999' }}>등록된 병원 없음</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hospitals.map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #E0E8E0' }}>
                  <strong style={{ color: '#4A7C59' }}>🏥 {h.name}</strong>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => editHosp(h)} style={btnSm}>수정</button>
                    <button onClick={() => delHosp(h.id)} style={{ ...btnSm, background: '#C62828' }}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#4A7C59', marginBottom: '0.25rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D0D8D0', borderRadius: '0.5rem', fontSize: '0.9375rem', boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '0.5rem 1.25rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' };
const btnSm: React.CSSProperties = { padding: '0.375rem 0.75rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' };
const tabBtn: React.CSSProperties = { padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' };