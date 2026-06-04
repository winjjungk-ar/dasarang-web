'use client';

import { useState, useEffect } from 'react';
import { getCaregivers, type Caregiver } from '@/lib/caregiverStore';

export default function EmploymentCertPage() {

  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRegNum, setCaregiverRegNum] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [position, setPosition] = useState('간병인');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('보험사 제출용');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [selectedCgId, setSelectedCgId] = useState('');

  useEffect(() => { setCaregivers(getCaregivers()); }, []);

  const handleSelectCg = (id: string) => {
    setSelectedCgId(id);
    const cg = getCaregivers().find(c => c.id === id);
    if (cg) { setCaregiverName(cg.name); setCaregiverRegNum(cg.regNum || ''); setPosition(cg.position || '간병인'); setJoinDate(cg.joinDate || ''); }
  };

  const handlePrint = () => window.print();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '____년 __월 __일';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const periodText = joinDate ? (() => {
    const join = new Date(joinDate + 'T00:00:00');
    const now = new Date();
    const totalMonths = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    if (totalMonths < 1) return '1개월 미만';
    const y = Math.floor(totalMonths / 12), m = totalMonths % 12;
    return `${y > 0 ? `${y}년 ` : ''}${m}개월`;
  })() : '';

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <div className="no-print"><h2 style={{ color: '#4A7C59', marginBottom: '1.5rem' }}>📜 재직증명서</h2></div>

      <div style={{ padding: '2.5rem', background: 'white', borderRadius: '0.75rem', border: '2px solid #4A7C59' }}>
        <h3 style={{ textAlign: 'center', color: '#4A7C59', marginBottom: '2rem', fontSize: '1.5rem' }}>재 직 증 명 서</h3>

        <div className="no-print" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem' }}>
            <div>
              <label style={ls}>간병인 선택</label>
              <select style={ins} value={selectedCgId} onChange={e => handleSelectCg(e.target.value)}>
                <option value="">직접 입력</option>
                {caregivers.map(cg => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
              </select>
            </div>
            <div><label style={ls}>간병인 성명</label><input style={ins} value={caregiverName} onChange={e => { setCaregiverName(e.target.value); setSelectedCgId(''); }} /></div>
            <div><label style={ls}>주민등록번호</label><input style={ins} value={caregiverRegNum} onChange={e => setCaregiverRegNum(e.target.value)} placeholder="000000-0000000" /></div>
            <div><label style={ls}>입사일</label><input type="date" style={ins} value={joinDate} onChange={e => setJoinDate(e.target.value)} /></div>
            <div><label style={ls}>직위</label><input style={ins} value={position} onChange={e => setPosition(e.target.value)} /></div>
            <div><label style={ls}>발급일</label><input type="date" style={ins} value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div><label style={ls}>발급 목적</label><input style={ins} value={purpose} onChange={e => setPurpose(e.target.value)} /></div>
          </div>
        </div>

        <div style={{ fontSize: '1.0625rem', lineHeight: 2.2, color: '#3D3929', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
            <tr><td style={{ width: '25%', padding: '0.5rem', fontWeight: 600 }}>성 명</td><td style={{ width: '25%', padding: '0.5rem', borderBottom: '1px solid #333' }}>{caregiverName || '__________'}</td><td style={{ width: '25%', padding: '0.5rem', fontWeight: 600 }}>주민등록번호</td><td style={{ width: '25%', padding: '0.5rem', borderBottom: '1px solid #333' }}>{caregiverRegNum || '__________'}</td></tr>
            <tr><td style={{ padding: '0.5rem', fontWeight: 600 }}>소 속</td><td style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>다사랑 간병공동체</td><td style={{ padding: '0.5rem', fontWeight: 600 }}>직 위</td><td style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>{position || '간병인'}</td></tr>
            <tr><td style={{ padding: '0.5rem', fontWeight: 600 }}>입 사 일</td><td style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>{formatDate(joinDate)}</td><td style={{ padding: '0.5rem', fontWeight: 600 }}>근속기간</td><td style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>{periodText || '__________'}</td></tr>
            <tr><td style={{ padding: '0.5rem', fontWeight: 600 }}>발급목적</td><td style={{ padding: '0.5rem', borderBottom: '1px solid #333' }} colSpan={3}>{purpose || '__________'}</td></tr>
          </tbody></table>
          <p style={{ marginTop: '2.5rem', textAlign: 'center' }}>위 사람은 당사에 재직 중인 간병인임을 증명합니다.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #D0D8D0' }}>
          <div style={{ textAlign: 'center' }}><p style={{ fontWeight: 600 }}>발급일</p><p>{formatDate(issueDate)}</p></div>
          <div style={{ textAlign: 'center', flex: 1 }}><p style={{ fontWeight: 600, fontSize: '1.125rem' }}>다사랑 간병공동체</p><p>대표 이순이 (직인)</p><p style={{ fontSize: '0.8125rem', color: '#6B7280' }}>사업자등록번호: 141-94-02083</p></div>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={handlePrint} style={{ padding: '0.75rem 2rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ 인쇄 / PDF 저장</button>
      </div>

      <style jsx>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#4A7C59', marginBottom: '0.25rem' };
const ins: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D0D8D0', borderRadius: '0.5rem', fontSize: '0.9375rem', boxSizing: 'border-box' };