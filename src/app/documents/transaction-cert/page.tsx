'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getCaregivers, type Caregiver, getPatients, type Patient } from '@/lib/caregiverStore';

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
}

export default function TransactionCertPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [hospital, setHospital] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchNote, setSearchNote] = useState('');

  // Dropdown data
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedCgId, setSelectedCgId] = useState('');
  const [selectedPatId, setSelectedPatId] = useState('');

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'transactions'));
      const list: Transaction[] = [];
      snap.forEach(d => {
        const d2 = d.data();
        list.push({ id: d.id, date: d2.date || '', type: d2.type || 'expense', amount: d2.amount || 0, category: d2.category || '', note: d2.note || '' });
      });
      setTransactions(list);
      setLoading(false);
    })();
    getCaregivers().then(setCaregivers);
    getPatients().then(setPatients);
  }, []);

  const handleSelectCg = (id: string) => {
    setSelectedCgId(id);
    const cg = caregivers.find(c => c.id === id);
    if (cg) setCaregiverName(cg.name);
  };

  const handleSelectPat = (id: string) => {
    setSelectedPatId(id);
    const p = patients.find(pp => pp.id === id);
    if (p) {
      setPatientName(p.patientName);
      setGuardianName(p.guardianName);
      setHospital(p.hospitalName || '');
      setSearchNote(p.patientName); // 기본 검색어를 환자명으로
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'income') return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (searchNote && !t.note.includes(searchNote) && !t.category.includes(searchNote)) return false;
      return true;
    });
  }, [transactions, startDate, endDate, searchNote]);

  const total = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);

  const fmt = (n: number) => n.toLocaleString();
  const fmtDate = (d: string) => {
    if (!d) return '____년 __월 __일';
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
  };

  const handlePrint = () => {
    const today = new Date().toISOString().split('T')[0];
    const prev = document.title;
    document.title = `${today}_${patientName || '환자'}_거래명세서`;
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1rem' }}>
      <div className="no-print">
        <h2 style={{ color: '#4A7C59', marginBottom: '1.5rem' }}>📄 거래 명세서</h2>
      </div>

      {/* 입력 폼 */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem', padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0' }}>
        <div>
          <label style={lbl}>🛌 환자·보호자 선택</label>
          <select style={inp} value={selectedPatId} onChange={e => handleSelectPat(e.target.value)}>
            <option value="">직접 입력</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.patientName} / {p.guardianName}</option>
            ))}
          </select>
        </div>
        <div><label style={lbl}>환자명</label><input style={inp} value={patientName} onChange={e => setPatientName(e.target.value)} /></div>
        <div><label style={lbl}>보호자명</label><input style={inp} value={guardianName} onChange={e => setGuardianName(e.target.value)} /></div>
        <div>
          <label style={lbl}>👩‍⚕️ 간병인 선택</label>
          <select style={inp} value={selectedCgId} onChange={e => handleSelectCg(e.target.value)}>
            <option value="">직접 입력</option>
            {caregivers.map(cg => (
              <option key={cg.id} value={cg.id}>{cg.name}</option>
            ))}
          </select>
        </div>
        <div><label style={lbl}>간병인</label><input style={inp} value={caregiverName} onChange={e => setCaregiverName(e.target.value)} /></div>
        <div><label style={lbl}>병원명</label><input style={inp} value={hospital} onChange={e => setHospital(e.target.value)} /></div>
        <div><label style={lbl}>📅 시작일</label><input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div><label style={lbl}>📅 종료일</label><input type="date" style={inp} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        <div><label style={lbl}>🔍 입금내역 검색</label><input style={inp} value={searchNote} onChange={e => setSearchNote(e.target.value)} placeholder="보호자명, 환자명 등" /></div>
      </div>

      {/* 거래명세서 출력본 */}
      <div style={{ border: '2px solid #333', padding: '2rem 1.5rem', background: 'white' }}>
        <h3 style={{ textAlign: 'center', fontSize: '1.375rem', fontWeight: 'bold', marginBottom: '1.5rem', letterSpacing: '0.3rem' }}>
          거 래 명 세 서
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <tbody>
            <tr>
              <td style={th2}>환자명</td><td style={td2}>{patientName}</td>
              <td style={th2}>보호자명</td><td style={td2}>{guardianName}</td>
              <td style={th2}>병원명</td><td style={td2}>{hospital}</td>
            </tr>
            <tr>
              <td style={th2}>간병인</td><td style={td2}>{caregiverName}</td>
              <td style={th2}>기간</td><td style={td2} colSpan={3}>{fmtDate(startDate)} ~ {fmtDate(endDate)}</td>
            </tr>
            <tr>
              <td style={th2}>소속업체</td><td style={td2}>다사랑 간병</td>
              <td style={th2}>사업자번호</td><td style={td2} colSpan={3}>141-94-02083</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: '#F5F5F5' }}>
              <th style={th2}>거래일자</th>
              <th style={th2}>금액</th>
              <th style={th2}>내용</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={3} style={{ ...td2, color: '#999', padding: '2rem' }}>
                {searchNote ? '검색 결과가 없습니다' : '기간을 선택하고 보호자명 등으로 검색해주세요'}
              </td></tr>
            ) : (
              filtered.map((t, i) => (
                <tr key={t.id} style={{ background: i % 2 === 0 ? '#FAFAFA' : 'white' }}>
                  <td style={td2}>{t.date}</td>
                  <td style={{ ...td2, fontWeight: 600, textAlign: 'right' }}>{fmt(t.amount)}원</td>
                  <td style={td2}>{t.note || t.category}</td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background: '#E8F5E9', fontWeight: 700 }}>
                <td style={th2}>합계</td>
                <td style={{ ...th2, textAlign: 'right', fontSize: '0.9375rem' }}>{fmt(total)}원</td>
                <td style={th2}>{filtered.length}건</td>
              </tr>
            </tfoot>
          )}
        </table>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 'bold', letterSpacing: '0.15rem' }}>
          상기와 같이 거래하였음을 확인합니다.<br /><br />
          {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일<br /><br />
          다 사 랑 간 병 공 동 체 (인)
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={handlePrint} style={btn}>🖨️ 인쇄 / PDF 저장</button>
      </div>

      <style jsx>{`@media print { .no-print { display: none !important; } body { font-size: 10px; } }`}</style>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#4A7C59', marginBottom: '0.25rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #D0D8D0', borderRadius: '0.5rem', fontSize: '0.9375rem', boxSizing: 'border-box' };
const td2: React.CSSProperties = { border: '1px solid #999', padding: '0.5rem', verticalAlign: 'middle', textAlign: 'center' };
const th2: React.CSSProperties = { border: '1px solid #999', padding: '0.5rem', background: '#F0F0F0', fontWeight: 600, textAlign: 'center' };
const btn: React.CSSProperties = { padding: '0.75rem 2rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
