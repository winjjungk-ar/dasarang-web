'use client';

import { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc as fireDoc } from 'firebase/firestore';
import { getCaregivers, type Caregiver, getHospitals, type Hospital, getPatients, type Patient } from '@/lib/caregiverStore';
import SignaturePad, { SignaturePrint } from '@/components/SignaturePad';

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  return (
    <select style={sel} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">선택</option>
      {hours.map(h => <option key={h} value={h}>{h}시</option>)}
    </select>
  );
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return '';
  let h = parseInt(end) - parseInt(start);
  if (h < 0) h += 24;
  return `${h}시간`;
}

export default function ConfirmationPage() {

  const [patientName, setPatientName] = useState('');
  const [patientBirth, setPatientBirth] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [hospital, setHospital] = useState('');
  const [admitStart, setAdmitStart] = useState('');
  const [admitEnd, setAdmitEnd] = useState('');

  const [cg1Name, setCg1Name] = useState('');
  const [cg1Birth, setCg1Birth] = useState('');
  const [cg1Phone, setCg1Phone] = useState('');
  const [cg2Name, setCg2Name] = useState('');
  const [cg2Birth, setCg2Birth] = useState('');
  const [cg2Phone, setCg2Phone] = useState('');

  const [careCost, setCareCost] = useState('');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospId, setSelectedHospId] = useState('');
  const [selectedPatId, setSelectedPatId] = useState('');
  const [selectedCg1Id, setSelectedCg1Id] = useState('');
  const [selectedCg2Id, setSelectedCg2Id] = useState('');
  const [sigCg1, setSigCg1] = useState('');
  const [sigCg2, setSigCg2] = useState('');
  const [hasCg1Attendance, setHasCg1Attendance] = useState<boolean | null>(null);
  const [hasCg2Attendance, setHasCg2Attendance] = useState<boolean | null>(null);

  // ── 저장 관련 ──
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedList, setSavedList] = useState<{ id: string; data: any }[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const [timeOverrides, setTimeOverrides] = useState<Record<number, { start1: string; end1: string; start2: string; end2: string }>>({});

  const timeEntries = useMemo(() => {
    if (!admitStart || !admitEnd) return [];
    const dates: string[] = [];
    const s = new Date(admitStart), e = new Date(admitEnd);
    if (s > e) return [];
    const cur = new Date(s);
    while (cur <= e) { dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1); }
    return dates.map((date, i) => {
      const ov = timeOverrides[i] || { start1: '', end1: '', start2: '', end2: '' };
      return { date, start1: ov.start1, end1: ov.end1, start2: ov.start2, end2: ov.end2 };
    });
  }, [admitStart, admitEnd, timeOverrides]);

  const totalHours = useMemo(() => {
    let total = 0;
    timeEntries.forEach(e => {
      if (e.start1 && e.end1) { let h = parseInt(e.end1) - parseInt(e.start1); if (h < 0) h += 24; total += h; }
      if (e.start2 && e.end2) { let h = parseInt(e.end2) - parseInt(e.start2); if (h < 0) h += 24; total += h; }
    });
    return `${total}시간`;
  }, [timeEntries]);

  const toggleDefaultTimes = () => {
    const allSet = timeEntries.length > 0 && timeEntries.every(e => e.start1 === '09' && e.end1 === '18');
    const newOverrides: Record<number, { start1: string; end1: string; start2: string; end2: string }> = {};
    timeEntries.forEach((_, i) => {
      newOverrides[i] = allSet
        ? { start1: '', end1: '', start2: '', end2: '' }
        : { start1: '09', end1: '18', start2: '09', end2: '18' };
    });
    setTimeOverrides(newOverrides);
  };
  const isAllTimesSet = timeEntries.length > 0 && timeEntries.every(e => e.start1 === '09' && e.end1 === '18');

  useEffect(() => { getCaregivers().then(setCaregivers); getHospitals().then(setHospitals); getPatients().then(setPatients); }, []);

  const handleSelectHospital = (id: string) => {
    setSelectedHospId(id);
    const h = hospitals.find(hh => hh.id === id);
    if (h) setHospital(h.name);
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatId(id);
    const p = patients.find(pp => pp.id === id);
    if (p) {
      setPatientName(p.patientName);
      setPatientPhone(p.patientPhone || '');
      setPatientBirth(p.birthDate || '');
    }
  };

  const handleSelectCg1 = async (id: string) => {
    setSelectedCg1Id(id);
    setHasCg1Attendance(null);
    const cg = caregivers.find(c => c.id === id);
    if (cg) { setCg1Name(cg.name); setCg1Phone(cg.phone); setCg1Birth(cg.birth); }
    if (id) {
      try {
        const q = query(collection(db, 'attendance'), where('caregiverId', '==', id));
        const snap = await getDocs(q);
        setHasCg1Attendance(!snap.empty);
      } catch { setHasCg1Attendance(false); }
    }
  };
  const handleSelectCg2 = async (id: string) => {
    setSelectedCg2Id(id);
    setHasCg2Attendance(null);
    const cg = caregivers.find(c => c.id === id);
    if (cg) { setCg2Name(cg.name); setCg2Phone(cg.phone); setCg2Birth(cg.birth); }
    if (id) {
      try {
        const q = query(collection(db, 'attendance'), where('caregiverId', '==', id));
        const snap = await getDocs(q);
        setHasCg2Attendance(!snap.empty);
      } catch { setHasCg2Attendance(false); }
    }
  };

  const handlePrint = () => {
    const today = new Date().toISOString().split('T')[0];
    const name = patientName || '환자';
    const docTitle = `${today}_${name}_사용확인서`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { window.print(); return; }

    const timeRows = timeEntries.map(e => {
      const d = new Date(e.date + 'T00:00:00');
      const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;
      const dur1 = calcDuration(e.start1, e.end1);
      const dur2 = calcDuration(e.start2, e.end2);
      return `<tr>
        <td>${dateStr}</td>
        <td>${e.start1 ? e.start1 + '시' : ''}</td>
        <td>${e.end1 ? e.end1 + '시' : ''}</td>
        <td>${dur1}</td>
        <td>${e.start2 ? e.start2 + '시' : ''}</td>
        <td>${e.end2 ? e.end2 + '시' : ''}</td>
        <td>${dur2}</td>
      </tr>`;
    }).join('');

    const cg2Row = cg2Name
      ? `<tr><th>공동 간병인</th><td>${cg2Name}</td><th>생년월일</th><td>${cg2Birth || ''}</td><th>전화번호</th><td>${cg2Phone || ''}</td></tr>`
      : '';

    const sig1Html = sigCg1
      ? `<img src="${sigCg1}" style="max-width:50mm;max-height:20mm;" alt="서명"><br>간병인 서명`
      : '(서명)';
    const sig2Block = cg2Name
      ? (sigCg2 ? `<img src="${sigCg2}" style="max-width:50mm;max-height:20mm;" alt="서명"><br>공동 간병인 서명` : '(서명)')
      : '';

    const now = new Date();
    const writeDate = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    @page { size: A4; margin: 0mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 210mm; min-height: 297mm;
      margin: 0; padding: 0;
      background: white; font-family: sans-serif;
    }
    .page { padding: 12mm 15mm; width: 210mm; }
    h2 { text-align: center; font-size: 7mm; font-weight: 800; letter-spacing: 1mm; margin-bottom: 8mm; color: #111; }
    .section { border: 1px solid #333; margin-bottom: 4mm; padding: 4mm; }
    .section-title { font-size: 3.8mm; font-weight: 700; margin-bottom: 2mm; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #555; padding: 2mm 3mm; font-size: 3.5mm; text-align: center; vertical-align: middle; }
    th { background: #F0F0F0; font-weight: 700; }
    .confirm { text-align: center; font-size: 4mm; font-weight: 700; margin: 5mm 0; padding: 4mm; border: 1px solid #333; }
    .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8mm; }
    .sig { text-align: center; flex: 1; font-size: 3.5mm; }
    .sig img { display: block; margin: 0 auto 1mm; }
    .total { text-align: right; font-size: 4mm; font-weight: 700; color: #4A7C59; margin-top: 2mm; }
    .bizno { text-align: center; font-weight: 700; font-size: 3.5mm; margin-top: 5mm; }
  </style>
</head>
<body>
  <div class="page">
    <h2>간병인 사용 확인서</h2>

    <div class="section">
      <div class="section-title">1. 피보험자 인적사항 및 간병장소</div>
      <table><tbody>
        <tr><th>성명</th><td>${patientName || ''}</td><th>생년월일</th><td>${patientBirth || ''}</td><th>전화번호</th><td>${patientPhone || ''}</td></tr>
        <tr><th>병원명</th><td colspan="3">${hospital || ''}</td><th>입원기간</th><td>${fmt(admitStart)} ~ ${fmt(admitEnd)}</td></tr>
      </tbody></table>
    </div>

    <div class="section">
      <div class="section-title">2. 간병인 인적사항</div>
      <table><tbody>
        <tr><th>성명</th><td>${cg1Name || ''}</td><th>생년월일</th><td>${cg1Birth || ''}</td><th>전화번호</th><td>${cg1Phone || ''}</td></tr>
        ${cg2Row}
      </tbody></table>
    </div>

    <div class="section">
      <div class="section-title">3. 간병인 소속 간병회사</div>
      <table><tbody>
        <tr><th>소속회사명</th><td>다사랑 간병</td><th>전화번호</th><td>01022751946</td><th>간병비</th><td>${careCost || ''}</td></tr>
      </tbody></table>

      ${timeEntries.length > 0 ? `
      <table style="margin-top:4mm;">
        <thead>
          <tr><th rowspan="2">입원일</th><th colspan="3">간병인 사용시간</th><th colspan="3">간병인 사용시간</th></tr>
          <tr><th>시작</th><th>종료</th><th>근무</th><th>시작</th><th>종료</th><th>근무</th></tr>
        </thead>
        <tbody>${timeRows}</tbody>
      </table>
      <div class="total">총 사용시간: ${totalHours}</div>
      ` : ''}
    </div>

    <div class="confirm">상기와 같이 간병인을 사용하였음을 확인 합니다.</div>

    <div class="footer">
      <div class="sig">${sig1Html}</div>
      <div class="sig">${sig2Block}</div>
      <div class="sig">작성일자: ${writeDate}</div>
    </div>

    <div class="bizno">사업자 번호: 141-94-02083 다사랑 간병</div>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    // setTimeout으로 DOM 파싱 완료 후 print() 호출 (모바일 "미리보기 준비중" 방지)
    setTimeout(() => {
      printWindow.print();
    }, 200);
    printWindow.onafterprint

  // ── 저장 함수 ──
  const loadSavedList = async () => {
    try {
      const snap = await getDocs(collection(db, 'confirmations'));
      const list: typeof savedList = [];
      snap.forEach(d => list.push({ id: d.id, data: d.data() }));
      setSavedList(list);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (showSaved) loadSavedList(); }, [showSaved]);

  const handleSave = async () => {
    if (!patientName) { alert('환자명을 입력해주세요'); return; }
    setSaving(true);
    const data = {
      patientName, patientBirth, patientPhone, hospital, admitStart, admitEnd,
      cg1Name, cg1Birth, cg1Phone, cg2Name, cg2Birth, cg2Phone,
      careCost, sigCg1, sigCg2, timeOverrides,
      updatedAt: new Date().toISOString(),
    };
    try {
      if (savedId) {
        await updateDoc(fireDoc(db, 'confirmations', savedId), data);
      } else {
        const ref = await addDoc(collection(db, 'confirmations'), { ...data, createdAt: new Date().toISOString() });
        setSavedId(ref.id);
      }
      alert('저장되었습니다!');
    } catch { alert('저장 실패'); }
    setSaving(false);
  };

  const handleLoad = (log: { id: string; data: any }) => {
    const d = log.data;
    setPatientName(d.patientName || '');
    setPatientBirth(d.patientBirth || '');
    setPatientPhone(d.patientPhone || '');
    setHospital(d.hospital || '');
    setAdmitStart(d.admitStart || '');
    setAdmitEnd(d.admitEnd || '');
    setCg1Name(d.cg1Name || '');
    setCg1Birth(d.cg1Birth || '');
    setCg1Phone(d.cg1Phone || '');
    setCg2Name(d.cg2Name || '');
    setCg2Birth(d.cg2Birth || '');
    setCg2Phone(d.cg2Phone || '');
    setCareCost(d.careCost || '');
    setSigCg1(d.sigCg1 || '');
    setSigCg2(d.sigCg2 || '');
    setTimeOverrides(d.timeOverrides || {});
    setSavedId(log.id);
    setShowSaved(false);
    setHasCg1Attendance(null);
    setHasCg2Attendance(null);
  };

  const handleDelete = async () => {
    if (!savedId || !confirm('정말 삭제하시겠습니까?')) return;
    try { await deleteDoc(fireDoc(db, 'confirmations', savedId)); setSavedId(null); alert('삭제되었습니다'); }
    catch { alert('삭제 실패'); }
  };

  const handleDeleteById = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try { await deleteDoc(fireDoc(db, 'confirmations', id)); setSavedList(prev => prev.filter(l => l.id !== id)); if (savedId === id) setSavedId(null); }
    catch { alert('삭제 실패'); }
  };

  // 출퇴근 차단 확인
  const blocked = (selectedCg1Id && hasCg1Attendance === false) || (selectedCg2Id && hasCg2Attendance === false);
  const blockReasons: string[] = [];
  if (selectedCg1Id && hasCg1Attendance === false) blockReasons.push(`${cg1Name || '간병인1'}님`);
  if (selectedCg2Id && hasCg2Attendance === false) blockReasons.push(`${cg2Name || '간병인2'}님`);
  const checking = (selectedCg1Id && hasCg1Attendance === null) || (selectedCg2Id && hasCg2Attendance === null);

  const updateEntry = (i: number, field: string, value: string) => {
    setTimeOverrides(prev => ({ ...prev, [i]: { ...(prev[i] || { start1: '', end1: '', start2: '', end2: '' }), [field]: value } }));
  };

  const fmt = (d: string) => {
    if (!d) return '____년 __월 __일';
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
  };
  const fmtShort = (d: string) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1rem' }}>
      <div className="no-print"><h2 style={{ color: '#4A7C59', marginBottom: '1.5rem' }}>📋 간병인 사용 확인서</h2></div>

      <div className="no-print" style={{ padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0', marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#4A7C59', marginBottom: '0.75rem' }}>1. 피보험자 인적사항</h4>
        <div style={grid4}>
          <div>
            <label style={lbl}>🛌 환자·보호자 선택</label>
            <select style={inp} value={selectedPatId} onChange={e => handleSelectPatient(e.target.value)}>
              <option value="">직접 입력</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.patientName} / {p.guardianName}</option>
              ))}
            </select>
          </div>
          <div><label style={lbl}>성명</label><input style={inp} value={patientName} onChange={e => setPatientName(e.target.value)} /></div>
          <div><label style={lbl}>생년월일</label><input type="date" style={inp} value={patientBirth} onChange={e => setPatientBirth(e.target.value)} /></div>
          <div><label style={lbl}>전화번호</label><input style={inp} value={patientPhone} onChange={e => setPatientPhone(e.target.value)} placeholder="010-0000-0000" /></div>
          <div><label style={lbl}>병원명</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select style={inp} value={selectedHospId} onChange={e => handleSelectHospital(e.target.value)}>
                <option value="">병원 선택</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <input style={inp} value={hospital} onChange={e => { setHospital(e.target.value); setSelectedHospId(''); }} placeholder="직접 입력" />
            </div>
          </div>
          <div><label style={lbl}>📅 입원 시작일</label><input type="date" style={inp} value={admitStart} onChange={e => setAdmitStart(e.target.value)} /></div>
          <div><label style={lbl}>📅 입원 종료일</label><input type="date" style={inp} value={admitEnd} onChange={e => setAdmitEnd(e.target.value)} /></div>
        </div>

        <h4 style={{ color: '#4A7C59', margin: '1rem 0 0.75rem' }}>2. 간병인 인적사항</h4>
        <div style={grid4}>
          <div>
            <label style={lbl}>간병인 선택</label>
            <select style={inp} value={selectedCg1Id} onChange={e => handleSelectCg1(e.target.value)}>
              <option value="">직접 입력</option>
              {caregivers.map(cg => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
            </select>
          </div>
        </div>
        <div style={grid4}>
          <div><label style={lbl}>간병인 성명</label><input style={inp} value={cg1Name} onChange={e => { setCg1Name(e.target.value); setSelectedCg1Id(''); }} /></div>
          <div><label style={lbl}>생년월일</label><input type="date" style={inp} value={cg1Birth} onChange={e => setCg1Birth(e.target.value)} /></div>
          <div><label style={lbl}>전화번호</label><input style={inp} value={cg1Phone} onChange={e => setCg1Phone(e.target.value)} placeholder="010-0000-0000" /></div>
        </div>
        <div style={{ ...grid4, marginTop: '0.5rem' }}>
          <div>
            <label style={lbl}>공동 간병인 선택</label>
            <select style={inp} value={selectedCg2Id} onChange={e => handleSelectCg2(e.target.value)}>
              <option value="">직접 입력</option>
              {caregivers.map(cg => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ ...grid4, marginTop: '0.5rem' }}>
          <div><label style={lbl}>공동 간병인 성명</label><input style={inp} value={cg2Name} onChange={e => { setCg2Name(e.target.value); setSelectedCg2Id(''); }} /></div>
          <div><label style={lbl}>생년월일</label><input type="date" style={inp} value={cg2Birth} onChange={e => setCg2Birth(e.target.value)} /></div>
          <div><label style={lbl}>전화번호</label><input style={inp} value={cg2Phone} onChange={e => setCg2Phone(e.target.value)} placeholder="010-0000-0000" /></div>
        </div>

        <h4 style={{ color: '#4A7C59', margin: '1rem 0 0.75rem' }}>3. 간병회사 정보</h4>
        <div style={grid4}>
          <div><label style={lbl}>소속회사명</label><input style={inp} value="다사랑 간병" disabled /></div>
          <div><label style={lbl}>전화번호</label><input style={inp} value="01022751946" disabled /></div>
          <div><label style={lbl}>간병비</label><input style={inp} value={careCost} onChange={e => setCareCost(e.target.value)} placeholder="예: 130,000원(1일)" /></div>
        </div>
      </div>

      {/* 출퇴근 기록 확인 */}
      {checking && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#FFF8E1', borderRadius: '0.5rem', border: '1px solid #FFE082', fontSize: '0.875rem', color: '#E65100' }}>
          ⏳ 출퇴근 기록 확인 중...
        </div>
      )}
      {blocked && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '1rem', background: '#FFEBEE', borderRadius: '0.5rem', border: '1px solid #EF9A9A' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#C62828', marginBottom: '0.25rem' }}>⚠️ 출퇴근 기록 없음</div>
          <div style={{ fontSize: '0.8125rem', color: '#B71C1C', lineHeight: '1.6' }}>
            {blockReasons.join(', ')}의 출퇴근 기록이 없습니다.<br />
            먼저 <strong>출퇴근 관리</strong>에서 출퇴근을 등록한 후 사용 확인서를 작성할 수 있습니다.
          </div>
        </div>
      )}

      <div style={{ border: '2px solid #333', padding: '1.5rem', background: 'white', fontSize: '0.8125rem' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '1.25rem' }}>
          간병인 사용 확인서
        </h3>

        <div style={{ border: '1px solid #333', marginBottom: '0.5rem', padding: '0.5rem' }}>
          <strong>1. 피보험자 인적사항 및 간병장소</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.375rem' }}><tbody>
            <tr><td style={th2}>성명</td><td style={td2}>{patientName}</td><td style={th2}>생년월일</td><td style={td2}>{patientBirth}</td><td style={th2}>전화번호</td><td style={td2}>{patientPhone}</td></tr>
            <tr><td style={th2}>병원명</td><td style={td2} colSpan={3}>{hospital}</td><td style={th2}>입원기간</td><td style={td2}>{fmt(admitStart)} ~ {fmt(admitEnd)}</td></tr>
          </tbody></table>
        </div>

        <div style={{ border: '1px solid #333', marginBottom: '0.5rem', padding: '0.5rem' }}>
          <strong>2. 간병인 인적사항</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.375rem' }}><tbody>
            <tr><td style={th2}>성명</td><td style={td2}>{cg1Name}</td><td style={th2}>생년월일</td><td style={td2}>{cg1Birth}</td><td style={th2}>전화번호</td><td style={td2}>{cg1Phone}</td></tr>
            {cg2Name && <tr><td style={th2}>공동 간병인</td><td style={td2}>{cg2Name}</td><td style={th2}>생년월일</td><td style={td2}>{cg2Birth}</td><td style={th2}>전화번호</td><td style={td2}>{cg2Phone}</td></tr>}
          </tbody></table>
        </div>

        <div style={{ border: '1px solid #333', marginBottom: '0.5rem', padding: '0.5rem' }}>
          <strong>3. 간병인 소속 간병회사</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.375rem' }}><tbody>
            <tr><td style={th2}>소속회사명</td><td style={td2}>다사랑 간병</td><td style={th2}>전화번호</td><td style={td2}>01022751946</td><td style={th2}>간병비</td><td style={td2}>{careCost}</td></tr>
          </tbody></table>

          {timeEntries.length > 0 && !blocked && (
            <div className="no-print" style={{ marginTop: '0.5rem' }}>
              <button onClick={toggleDefaultTimes} style={{ padding: '0.375rem 0.75rem', border: 'none', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', background: isAllTimesSet ? '#C62828' : '#4A7C59', color: 'white' }}>
                ⏰ {isAllTimesSet ? '출퇴근 해제' : '정시출퇴근 (09~18시)'}
              </button>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
            <thead>
              <tr><td style={th2} rowSpan={2}>입원일</td><td style={th2} colSpan={3}>간병인 사용시간</td><td style={th2} colSpan={3}>간병인 사용시간</td></tr>
              <tr><td style={th2}>시작</td><td style={th2}>종료</td><td style={th2}>근무</td><td style={th2}>시작</td><td style={th2}>종료</td><td style={th2}>근무</td></tr>
            </thead>
            <tbody>
              {timeEntries.length === 0 && <tr><td colSpan={7} style={{ ...td2, color: '#999' }}>입원 시작일과 종료일을 선택하면 자동으로 날짜가 생성됩니다</td></tr>}
              {timeEntries.map((e, i) => {
                const dur1 = calcDuration(e.start1, e.end1), dur2 = calcDuration(e.start2, e.end2);
                return (
                  <tr key={i}>
                    <td style={td2}>{fmtShort(e.date)}
                      <span className="no-print">
                        <button onClick={() => {
                          const isSet = e.start1 === '09' && e.end1 === '18';
                          updateEntry(i, 'start1', isSet ? '' : '09');
                          updateEntry(i, 'end1', isSet ? '' : '18');
                          if (!isSet) { updateEntry(i, 'start2', '09'); updateEntry(i, 'end2', '18'); }
                          else { updateEntry(i, 'start2', ''); updateEntry(i, 'end2', ''); }
                        }} style={{
                          marginLeft: '4px', padding: '1px 5px', fontSize: '0.625rem', cursor: 'pointer',
                          border: '1px solid #CCC', borderRadius: '3px',
                          background: e.start1 === '09' && e.end1 === '18' ? '#C62828' : '#E8F5E9',
                          color: e.start1 === '09' && e.end1 === '18' ? 'white' : '#4A7C59',
                        }}>⏰</button>
                      </span>
                    </td>
                    <td style={td2}><span className="no-print"><TimeSelect value={e.start1} onChange={v => updateEntry(i, 'start1', v)} /></span><span className="print-only" style={{ display: 'none' }}>{e.start1 ? `${e.start1}시` : ''}</span></td>
                    <td style={td2}><span className="no-print"><TimeSelect value={e.end1} onChange={v => updateEntry(i, 'end1', v)} /></span><span className="print-only" style={{ display: 'none' }}>{e.end1 ? `${e.end1}시` : ''}</span></td>
                    <td style={{ ...td2, fontWeight: 600, color: '#4A7C59' }}>{dur1}</td>
                    <td style={td2}><span className="no-print"><TimeSelect value={e.start2} onChange={v => updateEntry(i, 'start2', v)} /></span><span className="print-only" style={{ display: 'none' }}>{e.start2 ? `${e.start2}시` : ''}</span></td>
                    <td style={td2}><span className="no-print"><TimeSelect value={e.end2} onChange={v => updateEntry(i, 'end2', v)} /></span><span className="print-only" style={{ display: 'none' }}>{e.end2 ? `${e.end2}시` : ''}</span></td>
                    <td style={{ ...td2, fontWeight: 600, color: '#4A7C59' }}>{dur2}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.9375rem', fontWeight: 600, color: '#4A7C59' }}>총 사용시간: {totalHours}</div>
        </div>

        <div style={{ border: '1px solid #333', padding: '0.75rem', marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 'bold' }}>
          상기와 같이 간병인을 사용하였음을 확인 합니다.
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.5rem' }}><tbody>
          <tr>
            <td style={{ ...td2, width: '33%' }}>
              <span className="no-print"><SignaturePad label="간병인 서명" onSave={setSigCg1} saved={sigCg1} /></span>
              <span className="print-only" style={{ display: 'none' }}><SignaturePrint label="간병인 서명" dataUrl={sigCg1} /></span>
            </td>
            <td style={{ ...td2, width: '33%' }}>
              <span className="no-print"><SignaturePad label="공동 간병인 서명" onSave={setSigCg2} saved={sigCg2} /></span>
              <span className="print-only" style={{ display: 'none' }}><SignaturePrint label="공동 간병인 서명" dataUrl={sigCg2} /></span>
            </td>
            <td style={{ ...td2, width: '34%' }}>작성일자: {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일</td>
          </tr>
        </tbody></table>

        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>사업자 번호: 141-94-02083 다사랑 간병</div>
      </div>

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '0.75rem 2rem', background: saving ? '#999' : '#1565C0', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? '⏳ 저장 중...' : savedId ? '📝 업데이트' : '💾 사용확인서 저장'}
        </button>
        <button onClick={() => setShowSaved(!showSaved)} style={{
          padding: '0.75rem 1.5rem', background: '#6A1B9A', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
        }}>
          📂 저장목록 ({savedList.length})
        </button>
        {savedId && (
          <button onClick={handleDelete} style={{
            padding: '0.75rem 1.5rem', background: '#C62828', color: 'white',
            border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
          }}>🗑️ 삭제</button>
        )}
        {blocked ? (
          <div style={{ padding: '0.75rem', background: '#FFF3E0', borderRadius: '0.5rem', border: '1px solid #FFE0B2', fontSize: '0.875rem', color: '#E65100' }}>
            ⚠️ 출퇴근 기록 등록 후 인쇄할 수 있습니다
          </div>
        ) : timeEntries.length > 0 && (
          <button onClick={handlePrint} style={{ padding: '0.75rem 2rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ 인쇄 / PDF 저장</button>
        )}
      </div>

      {/* 저장목록 */}
      {showSaved && (
        <div className="no-print" style={{ marginTop: '1rem', padding: '1rem', background: '#F8F8FF', borderRadius: '0.75rem', border: '1px solid #E0E0F0', maxHeight: '300px', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#6A1B9A' }}>📂 저장된 사용확인서</h4>
          {savedList.length === 0 ? (
            <div style={{ color: '#999', fontSize: '0.85rem' }}>저장된 확인서가 없습니다</div>
          ) : (
            savedList.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #EEE', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '0.875rem' }}>{log.data.patientName || '(환자명 없음)'}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '0.75rem' }}>
                    {log.data.hospital} · {log.data.admitStart}~{log.data.admitEnd}
                  </span>
                </div>
                <button onClick={() => handleLoad(log)} style={{ padding: '0.25rem 0.75rem', background: '#1565C0', color: 'white', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}>불러오기</button>
                <button onClick={() => handleDeleteById(log.id)} style={{ padding: '0.25rem 0.5rem', background: '#C62828', color: 'white', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}>삭제</button>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        @media print {
          html, body {
            background: white !important;
            background-image: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-only { display: inline !important; }
          body { font-size: 8px; }
          table { font-size: 7px; }
          th, td { padding: 0 2px !important; }
          h3 { font-size: 13px !important; margin-bottom: 0.5rem !important; }
        }
      `}</style>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#4A7C59', marginBottom: '0.25rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D0D8D0', borderRadius: '0.5rem', fontSize: '0.9375rem', boxSizing: 'border-box' };
const td2: React.CSSProperties = { border: '1px solid #999', padding: '0.375rem 0.5rem', verticalAlign: 'middle', textAlign: 'center' };
const th2: React.CSSProperties = { border: '1px solid #999', padding: '0.375rem 0.5rem', background: '#F0F0F0', fontWeight: 600, textAlign: 'center' };
const sel: React.CSSProperties = { border: '1px solid #CCC', borderRadius: '3px', padding: '2px 4px', fontSize: '0.8125rem' };
const grid4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' };