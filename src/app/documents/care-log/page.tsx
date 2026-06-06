'use client';

import { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc as fireDoc } from 'firebase/firestore';
import { getCaregivers, type Caregiver, getPatients, type Patient } from '@/lib/caregiverStore';
import SignaturePad from '@/components/SignaturePad';

const TASKS = ['식사보조', '활동보조', '배변보조', '위생보조', '기타'];

function TimeSelect({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  return (
    <select style={sel} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
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

export default function CareLogPage() {

  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedCgId, setSelectedCgId] = useState('');
  const [selectedPatId, setSelectedPatId] = useState('');
  const [sigCaregiver, setSigCaregiver] = useState('');
  const [sigGuardian, setSigGuardian] = useState('');
  const [hasAttendance, setHasAttendance] = useState<boolean | null>(null); // null=아직 확인 안 함
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]); // 출퇴근 기록 있는 날짜 목록

  // ── 저장 관련 ──
  const [savedCareLogId, setSavedCareLogId] = useState<string | null>(null);
  const [savingCareLog, setSavingCareLog] = useState(false);
  const [savedLogs, setSavedLogs] = useState<{ id: string; data: any }[]>([]);
  const [showSavedLogs, setShowSavedLogs] = useState(false);

  useEffect(() => { getCaregivers().then(setCaregivers); getPatients().then(setPatients); }, []);
  useEffect(() => { if (showSavedLogs) loadSavedLogs(); }, [showSavedLogs]);

  const handleSelectCaregiver = async (id: string) => {
    setSelectedCgId(id);
    setHasAttendance(null);
    setAttendanceDates([]);
    const cg = caregivers.find(c => c.id === id);
    if (cg) {
      setCaregiverName(cg.name);
      setCaregiverPhone(cg.phone);
      // 해당 간병인의 출퇴근 기록 조회
      try {
        const q = query(collection(db, 'attendance'), where('caregiverId', '==', id));
        const snap = await getDocs(q);
        if (snap.empty) {
          setHasAttendance(false);
        } else {
          setHasAttendance(true);
          const dates: string[] = [];
          snap.forEach(doc => dates.push(doc.data().date));
          setAttendanceDates(dates);
        }
      } catch {
        setHasAttendance(false);
      }
    }
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatId(id);
    const p = patients.find(pp => pp.id === id);
    if (p) {
      setPatientName(p.patientName);
      setGender(p.gender || '');
      setBirthDate(p.birthDate || '');
    }
  };

  const [dailyLogs, setDailyLogs] = useState<Record<string, { startTime: string; endTime: string; tasks: string[] }>>({});

  const handlePrint = () => {
    const today = new Date().toISOString().split('T')[0];
    const docTitle = `${today}_${patientName || '환자'}_간병일지`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { window.print(); return; }

    // 날짜 포맷 헬퍼 (인쇄용 HTML 내에서 사용)
    const fmtPrint = (d: string) => {
      if (!d) return '';
      const dt = new Date(d + 'T00:00:00');
      return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
    };
    const birthPrint = birthDate ? (() => {
      const d = new Date(birthDate + 'T00:00:00');
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    })() : '';
    const genderPrint = gender === '남' ? '남' : gender === '여' ? '여' : '';

    // 일별 근무 테이블 행 생성
    const dailyRows = dateList.map((date, i) => {
      const log = dailyLogs[date] || { startTime: '', endTime: '', tasks: [] };
      const dur = calcDuration(log.startTime, log.endTime);
      const checkedTasks = TASKS.filter(t => log.tasks.includes(t));
      const taskText = checkedTasks.length > 0 ? checkedTasks.join(', ') : '';
      const timeDisplay = log.startTime && log.endTime
        ? `${log.startTime}시 ~ ${log.endTime}시`
        : log.startTime ? `${log.startTime}시 ~` : log.endTime ? `~ ${log.endTime}시` : '';
      return `<tr style="background:${i % 2 === 0 ? '#FAFAFA' : 'white'}">
        <td style="border:1px solid #999;padding:2mm 3mm;font-size:3.5mm;text-align:center;vertical-align:middle;">${fmtShort(date)}</td>
        <td style="border:1px solid #999;padding:2mm 3mm;font-size:3.5mm;text-align:center;vertical-align:middle;">${timeDisplay}</td>
        <td style="border:1px solid #999;padding:2mm 3mm;font-size:3.5mm;text-align:center;vertical-align:middle;font-weight:600;color:#4A7C59;">${dur}</td>
        <td style="border:1px solid #999;padding:2mm 3mm;font-size:3.5mm;text-align:center;vertical-align:middle;">${taskText}</td>
      </tr>`;
    }).join('');

    // 총 근무시간 계산
    let totalH = 0;
    dateList.forEach(d => {
      const log = dailyLogs[d];
      if (log?.startTime && log?.endTime) {
        let h = parseInt(log.endTime) - parseInt(log.startTime);
        if (h < 0) h += 24;
        totalH += h;
      }
    });

    // 서명 이미지
    const sigCaregiverHtml = sigCaregiver ? `<div style="display:inline-block;min-width:50mm;min-height:15mm;border:1px solid #CCC;padding:1mm;"><img src="${sigCaregiver}" style="max-width:48mm;max-height:13mm;" alt="간병인 서명" /></div>` : '<div style="display:inline-block;min-width:50mm;min-height:15mm;border:1px solid #CCC;padding:1mm;">&nbsp;</div>';
    const sigGuardianHtml = sigGuardian ? `<div style="display:inline-block;min-width:50mm;min-height:15mm;border:1px solid #CCC;padding:1mm;"><img src="${sigGuardian}" style="max-width:48mm;max-height:13mm;" alt="보호자 서명" /></div>` : '<div style="display:inline-block;min-width:50mm;min-height:15mm;border:1px solid #CCC;padding:1mm;">&nbsp;</div>';

    const now = new Date();
    const nowStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

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
      font-family: 'Noto Serif KR', serif;
    }
    .container {
      margin: 8mm 12mm;
      border: 2px solid #333;
      padding: 6mm 8mm;
      height: calc(297mm - 16mm);
    }
    h3 {
      text-align: center; font-size: 6mm; font-weight: 800;
      letter-spacing: 0.8mm; margin-bottom: 5mm; color: #111;
    }
    table { width: 100%; border-collapse: collapse; }
    td, th {
      border: 1px solid #999; padding: 2mm 3mm;
      font-size: 3.5mm; text-align: center; vertical-align: middle;
    }
    th { background: #F0F0F0; font-weight: 600; font-size: 3.2mm; color: #333; }
    .info-table th { width: 16%; }
    .signatures { display: flex; justify-content: center; gap: 10mm; margin-top: 5mm; padding-top: 3mm; border-top: 1px solid #999; }
    .sig-item { text-align: center; font-size: 3.5mm; }
    .sig-item .label { margin-bottom: 2mm; font-weight: 600; }
    .bottom-info { margin-top: 3mm; text-align: right; font-size: 3.5mm; }
    .company { margin-top: 4mm; text-align: center; font-size: 4mm; font-weight: 700; letter-spacing: 0.3mm; }
  </style>
</head>
<body>
  <div class="container">
    <h3>다사랑 간병 일지</h3>
    <table class="info-table">
      <tr>
        <th>환자명</th><td style="width:28%">${patientName || ''}</td>
        <th>성별</th><td style="width:12%">${genderPrint}</td>
        <th>생년월일</th><td style="width:28%">${birthPrint}</td>
      </tr>
      <tr>
        <th>간병인 성명</th><td>${caregiverName || ''}</td>
        <th>간병기간</th><td colspan="3">${fmtPrint(startDate)} ~ ${fmtPrint(endDate)}</td>
      </tr>
      <tr>
        <th>간병인 연락처</th><td>${caregiverPhone || ''}</td>
        <th>소속업체</th><td colspan="3">다사랑</td>
      </tr>
    </table>
    ${dateList.length > 0 ? `
    <table style="margin-top:3mm;">
      <thead>
        <tr>
          <th style="width:18%">간병일자</th>
          <th style="width:26%">간병시간</th>
          <th style="width:14%">근무시간</th>
          <th>간병 업무</th>
        </tr>
      </thead>
      <tbody>${dailyRows}</tbody>
    </table>` : ''}
    <div class="signatures">
      <div class="sig-item">
        <div class="label">간병인 서명</div>
        ${sigCaregiverHtml}
      </div>
      <div class="sig-item">
        <div class="label">보호자 서명</div>
        ${sigGuardianHtml}
      </div>
    </div>
    <div class="bottom-info">총 근무시간: ${totalH}시간</div>
    <div class="bottom-info" style="margin-top:1mm;">작성일시 ${nowStr}</div>
    <div class="company">제 천 지 역 자 활 센 터<br>다 사 랑 간 병 공 동 체 (인)</div>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => { try { printWindow.close(); } catch {} };
  };

  // ── 저장 함수 ──
  const handleSaveCareLog = async () => {
    if (!patientName) { alert('환자명을 입력해주세요'); return; }
    setSavingCareLog(true);
    const data = {
      patientName, gender, birthDate, caregiverName, caregiverPhone,
      caregiverId: selectedCgId, startDate, endDate,
      dailyLogs, sigCaregiver, sigGuardian,
      updatedAt: new Date().toISOString(),
    };
    try {
      if (savedCareLogId) {
        await updateDoc(fireDoc(db, 'careLogs', savedCareLogId), data);
      } else {
        const ref = await addDoc(collection(db, 'careLogs'), { ...data, createdAt: new Date().toISOString() });
        setSavedCareLogId(ref.id);
      }
      alert('저장되었습니다!');
    } catch { alert('저장 실패'); }
    setSavingCareLog(false);
  };

  const handleLoadCareLog = (log: { id: string; data: any }) => {
    const d = log.data;
    setPatientName(d.patientName || '');
    setGender(d.gender || '');
    setBirthDate(d.birthDate || '');
    setCaregiverName(d.caregiverName || '');
    setCaregiverPhone(d.caregiverPhone || '');
    setSelectedCgId(d.caregiverId || '');
    setStartDate(d.startDate || '');
    setEndDate(d.endDate || '');
    setDailyLogs(d.dailyLogs || {});
    setSigCaregiver(d.sigCaregiver || '');
    setSigGuardian(d.sigGuardian || '');
    setSavedCareLogId(log.id);
    setShowSavedLogs(false);
    setHasAttendance(null);
  };

  const handleDeleteCareLog = async () => {
    if (!savedCareLogId || !confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(fireDoc(db, 'careLogs', savedCareLogId));
      setSavedCareLogId(null);
      alert('삭제되었습니다');
    } catch { alert('삭제 실패'); }
  };

  const handleDeleteCareLogById = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(fireDoc(db, 'careLogs', id));
      setSavedLogs(prev => prev.filter(l => l.id !== id));
      if (savedCareLogId === id) setSavedCareLogId(null);
    } catch { alert('삭제 실패'); }
  };

  const loadSavedLogs = async () => {
    try {
      const snap = await getDocs(collection(db, 'careLogs'));
      const list: typeof savedLogs = [];
      snap.forEach(d => list.push({ id: d.id, data: d.data() }));
      setSavedLogs(list);
    } catch { /* ignore */ }
  };

  const dateList = useMemo(() => {
    if (!startDate || !endDate) return [];
    const dates: string[] = [];
    const s = new Date(startDate), e = new Date(endDate);
    if (s > e) return [];
    const cur = new Date(s);
    while (cur <= e) { dates.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1); }
    return dates;
  }, [startDate, endDate]);

  useMemo(() => {
    const init: typeof dailyLogs = {};
    dateList.forEach(d => { init[d] = dailyLogs[d] || { startTime: '', endTime: '', tasks: [] }; });
    setDailyLogs(init);
  }, [dateList]);

  const updateLog = (date: string, field: string, value: string) =>
    setDailyLogs(p => ({ ...p, [date]: { ...p[date], [field]: value } }));

  const toggleTask = (date: string, task: string) =>
    setDailyLogs(p => ({
      ...p, [date]: { ...p[date], tasks: p[date].tasks.includes(task) ? p[date].tasks.filter(t => t !== task) : [...p[date].tasks, task] }
    }));

  // 정시출퇴근 토글: 이미 09~18이면 해제, 아니면 적용
  const toggleDefaultHours = () => {
    const allSet = dateList.every(d => dailyLogs[d]?.startTime === '09' && dailyLogs[d]?.endTime === '18');
    setDailyLogs(p => {
      const next = { ...p };
      dateList.forEach(d => {
        next[d] = allSet
          ? { ...next[d], startTime: '', endTime: '' }
          : { ...next[d], startTime: '09', endTime: '18' };
      });
      return next;
    });
  };

  // 개별 날짜 정시출퇴근 토글
  const toggleDateHours = (date: string) => {
    setDailyLogs(p => {
      const cur = p[date];
      const isSet = cur?.startTime === '09' && cur?.endTime === '18';
      return { ...p, [date]: { ...cur, startTime: isSet ? '' : '09', endTime: isSet ? '' : '18' } };
    });
  };

  // 전체체크 토글
  const toggleAllTasks = () => {
    const allChecked = dateList.every(d => dailyLogs[d]?.tasks?.length === TASKS.length);
    setDailyLogs(p => {
      const next = { ...p };
      dateList.forEach(d => { next[d] = { ...next[d], tasks: allChecked ? [] : [...TASKS] }; });
      return next;
    });
  };

  // 전체 적용 여부
  const isAllHoursSet = dateList.length > 0 && dateList.every(d => dailyLogs[d]?.startTime === '09' && dailyLogs[d]?.endTime === '18');
  const isAllTasksChecked = dateList.length > 0 && dateList.every(d => dailyLogs[d]?.tasks?.length === TASKS.length);

  const fmt = (d: string) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
  };
  const fmtShort = (d: string) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    const yo = ['일', '월', '화', '수', '목', '금', '토'];
    return `${dt.getMonth() + 1}/${dt.getDate()}(${yo[dt.getDay()]})`;
  };

  // Total hours across all days
  const totalHours = useMemo(() => {
    let total = 0;
    dateList.forEach(d => {
      const log = dailyLogs[d];
      if (log?.startTime && log?.endTime) {
        let h = parseInt(log.endTime) - parseInt(log.startTime);
        if (h < 0) h += 24;
        total += h;
      }
    });
    return `${total}시간`;
  }, [dateList, dailyLogs]);

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1rem', fontFamily: "'Noto Serif KR', serif" }}>
      <div className="no-print">
        <h2 style={{ color: '#4A7C59', marginBottom: '1.5rem' }}>📋 다사랑 간병 일지</h2>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem', padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0' }}>
        <div>
          <label style={lbl}>🛌 환자·보호자 선택</label>
          <select style={inp} value={selectedPatId} onChange={e => handleSelectPatient(e.target.value)}>
            <option value="">직접 입력</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.patientName} / {p.guardianName}</option>
            ))}
          </select>
        </div>
        <div><label style={lbl}>환자명</label><input style={inp} value={patientName} onChange={e => setPatientName(e.target.value)} /></div>
        <div><label style={lbl}>성별</label><select style={inp} value={gender} onChange={e => setGender(e.target.value)}><option value="">선택</option><option value="남">남</option><option value="여">여</option></select></div>
        <div><label style={lbl}>생년월일</label><input type="date" style={inp} value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
        <div>
          <label style={lbl}>간병인 선택</label>
          <select style={inp} value={selectedCgId} onChange={e => handleSelectCaregiver(e.target.value)}>
            <option value="">직접 입력</option>
            {caregivers.map(cg => <option key={cg.id} value={cg.id}>{cg.name} ({cg.phone})</option>)}
          </select>
        </div>
        <div><label style={lbl}>간병인 성명</label><input style={inp} value={caregiverName} onChange={e => { setCaregiverName(e.target.value); setSelectedCgId(''); }} /></div>
        <div><label style={lbl}>간병인 연락처</label><input style={inp} value={caregiverPhone} onChange={e => setCaregiverPhone(e.target.value)} placeholder="010-0000-0000" /></div>
        <div><label style={lbl}>📅 시작일</label><input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div><label style={lbl}>📅 종료일</label><input type="date" style={inp} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
      </div>

      {/* 출퇴근 기록 확인 */}
      {selectedCgId && hasAttendance === null && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#FFF8E1', borderRadius: '0.5rem', border: '1px solid #FFE082', fontSize: '0.875rem', color: '#E65100' }}>
          ⏳ 출퇴근 기록 확인 중...
        </div>
      )}
      {selectedCgId && hasAttendance === false && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '1rem', background: '#FFEBEE', borderRadius: '0.5rem', border: '1px solid #EF9A9A' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#C62828', marginBottom: '0.25rem' }}>⚠️ 출퇴근 기록 없음</div>
          <div style={{ fontSize: '0.8125rem', color: '#B71C1C', lineHeight: '1.6' }}>
            선택한 간병인의 출퇴근 기록이 없습니다.<br />
            먼저 <strong>출퇴근 관리</strong>에서 출퇴근을 등록한 후 간병일지를 작성할 수 있습니다.
          </div>
        </div>
      )}

      {dateList.length > 0 && selectedCgId && hasAttendance === false && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#FFEBEE', borderRadius: '0.5rem', border: '1px solid #EF9A9A', fontSize: '0.875rem', color: '#C62828', textAlign: 'center' }}>
          ⚠️ 출퇴근 기록이 있어야 간병일지를 작성할 수 있습니다.
        </div>
      )}
      {dateList.length > 0 && !(selectedCgId && hasAttendance === false) && (
        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button onClick={toggleDefaultHours} style={{ ...btnSm, background: isAllHoursSet ? '#C62828' : '#4A7C59' }}>
            ⏰ {isAllHoursSet ? '출퇴근 해제' : '정시출퇴근 (09~18시)'}
          </button>
          <button onClick={toggleAllTasks} style={{ ...btnSm, background: isAllTasksChecked ? '#C62828' : '#E65100' }}>
            ☑️ {isAllTasksChecked ? '전체 해제' : '전체 업무 체크'}
          </button>
        </div>
      )}

      <div style={{ border: '2px solid #333', padding: '2rem 1.5rem', background: 'white' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.375rem', fontWeight: 'bold', marginBottom: '1.5rem', letterSpacing: '0.3rem' }}>다사랑 간병 일지</h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <tbody>
            <tr>
              <td style={th2}>환자명</td><td style={td2}>{patientName}</td>
              <td style={th2}>성별</td><td style={td2}>{gender} (남 / 여)</td>
              <td style={th2}>생년월일</td><td style={td2}>{birthDate}</td>
            </tr>
            <tr>
              <td style={th2}>간병인 성명</td><td style={td2}>{caregiverName}</td>
              <td style={th2}>간병기간</td><td style={td2} colSpan={3}>{fmt(startDate)} ~ {fmt(endDate)}</td>
            </tr>
            <tr>
              <td style={th2}>간병인 연락처</td><td style={td2}>{caregiverPhone}</td>
              <td style={th2}>소속업체</td><td style={td2} colSpan={3}>다사랑</td>
            </tr>
          </tbody>
        </table>

        {dateList.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th style={{ ...th2, width: '15%' }}>간병일자</th>
                <th style={{ ...th2, width: '22%' }}>간병시간</th>
                <th style={{ ...th2, width: '12%' }}>근무시간</th>
                <th style={{ ...th2 }}>간병 업무</th>
              </tr>
            </thead>
            <tbody>
              {dateList.map((date, i) => {
                const log = dailyLogs[date] || { startTime: '', endTime: '', tasks: [] };
                const dur = calcDuration(log.startTime, log.endTime);
                return (
                  <tr key={date} style={{ background: i % 2 === 0 ? '#FAFAFA' : 'white' }}>
                    <td style={td2}>{fmtShort(date)}</td>
                    <td style={td2}>
                      <span className="no-print">
                        <TimeSelect value={log.startTime} onChange={v => updateLog(date, 'startTime', v)} placeholder="시작" />
                        <span style={{ margin: '0 4px' }}>~</span>
                        <TimeSelect value={log.endTime} onChange={v => updateLog(date, 'endTime', v)} placeholder="종료" />
                        <button onClick={() => toggleDateHours(date)}
                          style={{
                            marginLeft: '4px', padding: '1px 5px', fontSize: '0.6875rem', cursor: 'pointer',
                            border: '1px solid #CCC', borderRadius: '3px',
                            background: log.startTime === '09' && log.endTime === '18' ? '#C62828' : '#E8F5E9',
                            color: log.startTime === '09' && log.endTime === '18' ? 'white' : '#4A7C59',
                          }}
                          title={log.startTime === '09' && log.endTime === '18' ? '해제' : '09~18시'}>
                          ⏰
                        </button>
                      </span>
                    </td>
                    <td style={{ ...td2, fontWeight: 600, color: '#4A7C59' }}>{dur}</td>
                    <td style={td2}>
                      <span className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {TASKS.map(t => (
                          <label key={t} style={{ fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <input type="checkbox" checked={log.tasks.includes(t)} onChange={() => toggleTask(date, t)} />{t}
                          </label>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Signatures */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E0E8E0', flexWrap: 'wrap' }}>
          <SignaturePad label="간병인 서명" onSave={setSigCaregiver} saved={sigCaregiver} />
          <SignaturePad label="보호자 서명" onSave={setSigGuardian} saved={sigGuardian} />
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.9375rem', fontWeight: 600, color: '#4A7C59' }}>
          총 근무시간: {totalHours}
        </div>
        <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', textAlign: 'right' }}>
          작성일시 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일
        </div>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 'bold', letterSpacing: '0.15rem' }}>
          제 천 지 역 자 활 센 터<br />
          다 사 랑 간 병 공 동 체 (인)
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleSaveCareLog} disabled={savingCareLog} style={{
          padding: '0.75rem 2rem', background: savingCareLog ? '#999' : '#1565C0', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: savingCareLog ? 'not-allowed' : 'pointer',
        }}>
          {savingCareLog ? '⏳ 저장 중...' : savedCareLogId ? '📝 업데이트' : '💾 간병일지 저장'}
        </button>
        <button onClick={() => setShowSavedLogs(!showSavedLogs)} style={{
          padding: '0.75rem 1.5rem', background: '#6A1B9A', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
        }}>
          📂 저장목록 ({savedLogs.length})
        </button>
        {savedCareLogId && (
          <button onClick={handleDeleteCareLog} style={{
            padding: '0.75rem 1.5rem', background: '#C62828', color: 'white',
            border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
          }}>🗑️ 삭제</button>
        )}
        <button onClick={handlePrint} style={{ padding: '0.75rem 2rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ 인쇄 / PDF 저장</button>
      </div>

      {/* 저장목록 */}
      {showSavedLogs && (
        <div className="no-print" style={{ marginTop: '1rem', padding: '1rem', background: '#F8F8FF', borderRadius: '0.75rem', border: '1px solid #E0E0F0', maxHeight: '300px', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#6A1B9A' }}>📂 저장된 간병일지</h4>
          {savedLogs.length === 0 ? (
            <div style={{ color: '#999', fontSize: '0.85rem' }}>저장된 일지가 없습니다</div>
          ) : (
            savedLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #EEE', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '0.875rem' }}>{log.data.patientName || '(환자명 없음)'}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '0.75rem' }}>
                    {log.data.caregiverName} · {log.data.startDate}~{log.data.endDate}
                  </span>
                </div>
                <button onClick={() => handleLoadCareLog(log)} style={{ padding: '0.25rem 0.75rem', background: '#1565C0', color: 'white', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}>불러오기</button>
                <button onClick={() => handleDeleteCareLogById(log.id)} style={{ padding: '0.25rem 0.5rem', background: '#C62828', color: 'white', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}>삭제</button>
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
        }
      `}</style>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#4A7C59', marginBottom: '0.25rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D0D8D0', borderRadius: '0.5rem', fontSize: '0.9375rem', boxSizing: 'border-box' };
const td2: React.CSSProperties = { border: '1px solid #999', padding: '0.5rem', verticalAlign: 'middle', textAlign: 'center' };
const th2: React.CSSProperties = { border: '1px solid #999', padding: '0.5rem', background: '#F0F0F0', fontWeight: 600, textAlign: 'center' };
const sel: React.CSSProperties = { border: '1px solid #CCC', borderRadius: '3px', padding: '2px', fontSize: '0.75rem' };
const btnSm: React.CSSProperties = { padding: '0.5rem 1rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' };