'use client';

import { useState, useMemo, useEffect } from 'react';
import { getCaregivers, type Caregiver, getHospitals, type Hospital } from '@/lib/caregiverStore';
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
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospId, setSelectedHospId] = useState('');
  const [selectedCg1Id, setSelectedCg1Id] = useState('');
  const [selectedCg2Id, setSelectedCg2Id] = useState('');
  const [sigCg1, setSigCg1] = useState('');
  const [sigCg2, setSigCg2] = useState('');

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

  useEffect(() => { setCaregivers(getCaregivers()); setHospitals(getHospitals()); }, []);

  const handleSelectHospital = (id: string) => {
    setSelectedHospId(id);
    const h = getHospitals().find(hh => hh.id === id);
    if (h) setHospital(h.name);
  };

  const handleSelectCg1 = (id: string) => {
    setSelectedCg1Id(id);
    const cg = getCaregivers().find(c => c.id === id);
    if (cg) { setCg1Name(cg.name); setCg1Phone(cg.phone); setCg1Birth(cg.birth); }
  };
  const handleSelectCg2 = (id: string) => {
    setSelectedCg2Id(id);
    const cg = getCaregivers().find(c => c.id === id);
    if (cg) { setCg2Name(cg.name); setCg2Phone(cg.phone); setCg2Birth(cg.birth); }
  };

  const handlePrint = () => window.print();

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

          {timeEntries.length > 0 && (
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

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={handlePrint} style={{ padding: '0.75rem 2rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ 인쇄 / PDF 저장</button>
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: inline !important; }
          body { font-size: 9px; }
          table { font-size: 7.5px; }
          th, td { padding: 1px 3px !important; }
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