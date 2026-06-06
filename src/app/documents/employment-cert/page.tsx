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

  useEffect(() => { getCaregivers().then(setCaregivers); }, []);

  const handleSelectCg = (id: string) => {
    setSelectedCgId(id);
    const cg = caregivers.find(c => c.id === id);
    if (cg) { setCaregiverName(cg.name); setCaregiverRegNum(cg.regNum || ''); setPosition(cg.position || '간병인'); setJoinDate(cg.joinDate || ''); }
  };

  const handlePrint = () => {
    const today = new Date().toISOString().split('T')[0];
    const name = caregiverName || '재직증명서';
    const docTitle = `${today}_${name}_재직증명서`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { window.print(); return; }

    // mm 단위 고정 — rem 의존 제거 (Android rem 기준 불확실)
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    @page { size: A4; margin: 0mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 210mm; height: 297mm;
      margin: 0; padding: 0;
      overflow: hidden;
      background: white;
      font-family: sans-serif;
    }
    .cert {
      margin: 10mm 12mm;
      border: 2px solid #333;
      padding: 8mm 10mm;
      height: calc(297mm - 20mm);
    }
    h3 {
      text-align: center; font-size: 7mm; font-weight: 800;
      letter-spacing: 1.5mm; margin-bottom: 8mm; color: #111;
    }
    table { width: 100%; border-collapse: collapse; }
    td, th {
      border: 1px solid #555; padding: 3mm 4mm;
      font-size: 3.8mm; text-align: center; vertical-align: middle;
    }
    th { background: #F5F5F5; font-weight: 700; font-size: 3.5mm; color: #333; width: 18%; }
    .proof { text-align: center; margin: 35mm 0 38mm 0; font-size: 4mm; font-weight: 500; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10mm; padding-top: 5mm; }
    .issuer { text-align: center; flex: 2; }
    .issuer .name { font-weight: 800; font-size: 4.5mm; letter-spacing: 0.5mm; }
    .issuer .sub { font-size: 3.8mm; margin-top: 1mm; }
    .issuer .reg { font-size: 3mm; color: #888; margin-top: 1mm; }
    .date-col { text-align: center; flex: 1; }
    .date-col .label { font-size: 3.5mm; color: #555; }
    .date-col .val { font-weight: 600; font-size: 4mm; margin-top: 1mm; }
  </style>
</head>
<body>
  <div class="cert">
    <h3>재 직 증 명 서</h3>
    <table>
      <tr>
        <th>성　명</th><td style="width:32%">${caregiverName || '　'}</td>
        <th>주민등록번호</th><td style="width:32%">${caregiverRegNum || '　'}</td>
      </tr>
      <tr>
        <th>소　속</th><td>다사랑 간병공동체</td>
        <th>직　위</th><td>${position || '간병인'}</td>
      </tr>
      <tr>
        <th>입 사 일</th><td>${formatDate(joinDate)}</td>
        <th>근속기간</th><td>${periodText || '　'}</td>
      </tr>
      <tr>
        <th>발급목적</th><td colspan="3">${purpose || '　'}</td>
      </tr>
    </table>
    <p class="proof">위 사람은 당사에 재직 중인 간병인임을 증명합니다.</p>
    <div class="footer">
      <div class="date-col"><p class="label">발급일</p><p class="val">${formatDate(issueDate)}</p></div>
      <div class="issuer"><p class="name">다사랑 간병공동체</p><p class="sub">대표 이순이 (인)</p><p class="reg">사업자등록번호 141-94-02083</p></div>
    </div>
  </div>
</body>
</html>`);
    printWindow.document.close();
    // onload 대신 동기 호출 — 모바일 Chrome에서 onload 불발 방지
    printWindow.print();
    setTimeout(() => { try { printWindow.close(); } catch {} }, 800);
  };

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

  const td: React.CSSProperties = {
    border: '1px solid #555', padding: '0.5rem 0.4rem',
    textAlign: 'center', fontSize: '0.85rem', verticalAlign: 'middle',
  };
  const th: React.CSSProperties = {
    ...td, background: '#F5F5F5', fontWeight: 700,
    fontSize: '0.8rem', color: '#333', width: '18%',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <div className="no-print"><h2 style={{ color: '#4A7C59', marginBottom: '1.5rem' }}>📜 재직증명서</h2></div>

      {/* 입력 폼 */}
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

      {/* ───── 인쇄용 문서 ───── */}
      <div className="doc-print-area" style={{
        border: '3px solid #333',
        padding: '1.8rem 1.5rem',
        background: 'white',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        {/* 제목 */}
        <h3 style={{
          textAlign: 'center', fontSize: '1.4rem', fontWeight: 800,
          letterSpacing: '0.6rem', marginBottom: '2rem', color: '#111',
        }}>재 직 증 명 서</h3>

        {/* 기본정보 테이블 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
          <tbody>
            <tr>
              <td style={th}>성　명</td>
              <td style={{ ...td, width: '32%' }}>{caregiverName || '　'}</td>
              <td style={th}>주민등록번호</td>
              <td style={{ ...td, width: '32%' }}>{caregiverRegNum || '　'}</td>
            </tr>
            <tr>
              <td style={th}>소　속</td>
              <td style={td}>다사랑 간병공동체</td>
              <td style={th}>직　위</td>
              <td style={td}>{position || '간병인'}</td>
            </tr>
            <tr>
              <td style={th}>입 사 일</td>
              <td style={td}>{formatDate(joinDate)}</td>
              <td style={th}>근속기간</td>
              <td style={td}>{periodText || '　'}</td>
            </tr>
            <tr>
              <td style={th}>발급목적</td>
              <td style={td} colSpan={3}>{purpose || '　'}</td>
            </tr>
          </tbody>
        </table>

        {/* 증명문구 */}
        <p style={{
          textAlign: 'center', margin: '19rem 0 20rem 0',
          fontSize: '1rem', fontWeight: 500, lineHeight: 1.8,
        }}>
          위 사람은 당사에 재직 중인 간병인임을 증명합니다.
        </p>

        {/* 발급일 + 발급자 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginTop: '5rem', paddingTop: '1.5rem',
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>발급일</p>
            <p style={{ margin: '0.3rem 0 0 0', fontWeight: 600, fontSize: '0.95rem' }}>{formatDate(issueDate)}</p>
          </div>
          <div style={{ textAlign: 'center', flex: 2 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.15rem' }}>다사랑 간병공동체</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>대표 이순이 (인)</p>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: '#888' }}>사업자등록번호 141-94-02083</p>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={handlePrint} style={{ padding: '0.75rem 2rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ 인쇄 / PDF 저장</button>
        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
          📱 모바일: [인쇄 / PDF 저장] 클릭 → 새 창에서 자동 인쇄 다이얼로그 열림 → PDF 저장
        </p>
      </div>

      <style jsx>{`@media print {
        @page { margin: 0 !important; size: A4 portrait; }
        html, body {
          height: auto !important; min-height: 0 !important;
          overflow: visible !important;
          margin: 0 !important; padding: 0 !important;
          background: white !important;
          background-image: none !important;
          font-size: 11px !important;
          width: 100% !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* 컨테이너 초기화 */
        body > div, body > div > div, body > div > div > div {
          margin: 0 !important; padding: 0 !important;
          max-width: none !important;
          width: 100% !important;
          background: white !important;
        }
        .no-print { display: none !important; }
        .doc-print-area {
          border: 2px solid #333 !important;
          padding: 6mm 5mm !important;
          margin: 0 auto !important;
          border-radius: 0 !important;
          width: 100% !important;
          max-width: none !important;
          background: white !important;
          min-height: 0 !important;
          box-sizing: border-box !important;
        }
        /* 제목 */
        h3 {
          font-size: 20px !important;
          margin: 0 0 5mm 0 !important;
          letter-spacing: 0.3rem !important;
          text-align: center !important;
        }
        /* 증명문구 */
        .doc-print-area > p {
          margin: 20mm 0 !important;
          font-size: 12px !important;
          line-height: 1.5 !important;
          text-align: center !important;
        }
        /* 하단 발급일+발급자 */
        .doc-print-area > div:last-of-type {
          margin-top: 10mm !important;
          padding-top: 3mm !important;
        }
        /* 테이블 */
        table {
          font-size: 11px !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }
        td, th {
          padding: 5px 6px !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
        }
        /* 페이지 분할 */
        * { page-break-inside: auto !important; }
        .doc-print-area { page-break-inside: avoid !important; }
      }`}</style>
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#4A7C59', marginBottom: '0.25rem' };
const ins: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D0D8D0', borderRadius: '0.5rem', fontSize: '0.9375rem', boxSizing: 'border-box' };
