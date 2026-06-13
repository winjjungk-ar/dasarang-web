'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getCaregivers, type Caregiver, getHospitals, type Hospital } from '@/lib/caregiverStore';

interface Attendance {
  id: string; caregiverId: string; caregiverName: string;
  hospitalName: string; date: string; clockIn: string; clockOut: string; totalHours: number;
}
interface InvoiceItem {
  caregiverName: string; days: number; hours: number; hourlyRate: number; amount: number;
}
interface Invoice {
  id: string; hospitalName: string; year: number; month: number;
  items: InvoiceItem[]; totalAmount: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string; paidAt?: string; notes?: string;
}

const STATUS_OPT = { draft: '📝 초안', sent: '📤 발송됨', paid: '✅ 입금완료' } as const;
const STATUS_COLOR: Record<string, string> = { draft: '#E65100', sent: '#1565C0', paid: '#2D5A3D' };

export default function InvoicePage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // 생성 폼
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selHospital, setSelHospital] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Load each dataset independently — one failure shouldn't kill the others
        const results = await Promise.allSettled([
          getCaregivers(), getHospitals(),
          getDocs(collection(db, 'attendance')),
          getDocs(query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))),
        ]);

        const [cgR, hospR, attR, invR] = results;

        if (cgR.status === 'fulfilled') setCaregivers(cgR.value);
        else console.error('Caregivers load failed:', cgR.reason?.message);

        if (hospR.status === 'fulfilled') setHospitals(hospR.value);
        else console.error('Hospitals load failed:', hospR.reason?.message);

        if (attR.status === 'fulfilled') {
          const alist: Attendance[] = [];
          attR.value.forEach(d => { const dt = d.data(); alist.push({ id: d.id, ...dt } as Attendance); });
          setRecords(alist);
        } else console.error('Attendance load failed:', attR.reason?.message);

        if (invR.status === 'fulfilled') {
          const ilist: Invoice[] = [];
          invR.value.forEach(d => { ilist.push({ id: d.id, ...d.data() } as Invoice); });
          setInvoices(ilist);
        } else console.error('Invoices load failed:', invR.reason?.message);
      } catch (e) {
        console.error('Invoice page load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 청구서 생성
  const handleGenerate = () => {
    if (!selHospital) { alert('병원을 선택해주세요'); return; }
    const monthPrefix = `${selYear}-${String(selMonth).padStart(2, '0')}`;
    console.log('[Invoice] Generate:', { selHospital, monthPrefix, totalRecords: records.length, sampleDates: records.slice(0,3).map(r=>r.date), sampleHospitals: [...new Set(records.map(r=>r.hospitalName))] });
    const filtered = records.filter(r => r.date.startsWith(monthPrefix) && r.hospitalName === selHospital);
    console.log('[Invoice] Filtered:', filtered.length);
    if (filtered.length === 0) {
      // Show what IS available to help debugging
      const availableMonths = [...new Set(records.filter(r => r.hospitalName === selHospital).map(r => r.date?.substring(0,7)))].sort();
      const availableHospitals = [...new Set(records.map(r => r.hospitalName).filter(Boolean))].sort();
      let msg = `${selHospital}의 ${selYear}년 ${selMonth}월 출퇴근 기록이 없습니다.`;
      if (availableMonths.length > 0) msg += `\n\n${selHospital} 기록 있는 월: ${availableMonths.join(', ')}`;
      else if (availableHospitals.length > 0) msg += `\n\n기록 있는 병원: ${availableHospitals.join(', ')}`;
      else msg += `\n\n출퇴근 기록이 아직 없습니다. 먼저 /checkin 또는 출퇴근 관리에서 기록을 추가해주세요.`;
      alert(msg);
      return;
    }

    const cgRateMap: Record<string, number> = {};
    caregivers.forEach(c => { cgRateMap[c.id] = c.hourlyRate || 0; });

    const cgMap: Record<string, InvoiceItem> = {};
    filtered.forEach(r => {
      const key = r.caregiverId || r.caregiverName;
      if (!cgMap[key]) {
        cgMap[key] = { caregiverName: r.caregiverName, days: 0, hours: 0, hourlyRate: cgRateMap[r.caregiverId] || 0, amount: 0 };
      }
      cgMap[key].days++;
      cgMap[key].hours += r.totalHours || 0;
    });
    const items = Object.values(cgMap).map(it => ({
      ...it, amount: Math.round(it.hours * it.hourlyRate),
    })).sort((a, b) => b.amount - a.amount);
    const totalAmount = items.reduce((s, it) => s + it.amount, 0);

    const inv: Invoice = {
      id: '', hospitalName: selHospital, year: selYear, month: selMonth,
      items, totalAmount, status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setGeneratedInvoice(inv);
  };

  // 저장
  const handleSave = async () => {
    if (!generatedInvoice) return;
    try {
      const ref = await addDoc(collection(db, 'invoices'), generatedInvoice);
      const saved = { ...generatedInvoice, id: ref.id };
      setInvoices(prev => [saved, ...prev]);
      setGeneratedInvoice(null);
      alert('청구서가 저장되었습니다!');
    } catch (e) { alert('저장 실패'); }
  };

  // 상태 변경
  const handleStatus = async (id: string, status: Invoice['status']) => {
    const data: any = { status };
    if (status === 'paid') data.paidAt = new Date().toISOString();
    await updateDoc(doc(db, 'invoices', id), data);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 청구서를 삭제할까요?')) return;
    await deleteDoc(doc(db, 'invoices', id));
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const fmt = (n: number) => n.toLocaleString();
  const hospitalNames = useMemo(() => {
    const s = new Set<string>();
    records.forEach(r => { if (r.hospitalName) s.add(r.hospitalName); });
    return Array.from(s).sort();
  }, [records]);

  // 미수금 요약
  const unpaidTotal = useMemo(() =>
    invoices.filter(inv => inv.status !== 'paid').reduce((s, inv) => s + inv.totalAmount, 0),
  [invoices]);
  const unpaidCount = invoices.filter(inv => inv.status !== 'paid').length;

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D5A3D', margin: 0 }}>🧾 병원별 청구서</h2>
        <div style={{ flex: 1 }} />
      </div>

      {/* 미수금 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: '미수금', value: `${fmt(unpaidTotal)}원`, color: '#C62828', bg: '#FFEBEE' },
          { label: '미납 청구서', value: `${unpaidCount}건`, color: '#E65100', bg: '#FFF3E0' },
          { label: '전체 청구서', value: `${invoices.length}건`, color: '#2D5A3D', bg: '#E8F5E9' },
        ].map(card => (
          <div key={card.label} style={{ padding: '1rem', background: card.bg, borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 청구서 생성 폼 */}
      <div className="no-print" style={{ padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0', marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#2D5A3D', marginBottom: '0.75rem' }}>📝 새 청구서 생성</h4>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={selStyle} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select style={selStyle} value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
            {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}월</option>)}
          </select>
          <select style={{...selStyle, minWidth:'180px'}} value={selHospital} onChange={e => setSelHospital(e.target.value)}>
            <option value="">병원 선택</option>
            {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
            {hospitalNames.filter(h => !hospitals.find(x => x.name === h)).map(h => <option key={h} value={h}>{h} (기록有)</option>)}
          </select>
          {hospitals.length === 0 && hospitalNames.length === 0 && (
            <input type="text" value={selHospital} onChange={e => setSelHospital(e.target.value)}
              placeholder="병원명 직접 입력"
              style={{ padding:'0.4rem 0.6rem', border:'1px solid #CCC', borderRadius:'0.4rem', fontSize:'0.85rem', minWidth:'150px' }} />
          )}
          <button onClick={handleGenerate} style={btnPrimary}>📊 청구서 생성</button>
        </div>
      </div>

      {/* 생성된 청구서 미리보기 */}
      {generatedInvoice && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '0.75rem', border: '2px solid #2D5A3D' }} className="invoice">
          <div className="no-print" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setGeneratedInvoice(null)} style={btnCancel}>취소</button>
            <button onClick={handleSave} style={btnPrimary}>💾 청구서 저장</button>
            <button onClick={() => window.print()} style={{...btnPrimary, background:'#4A7C59'}}>🖨️ 인쇄</button>
          </div>

          <h3 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.15rem', marginBottom: '1.5rem' }}>
            간 병 비 청 구 서
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <tbody>
              <tr>
                <td style={th2}>청구병원</td><td style={{...td2, fontWeight:700}}>{generatedInvoice.hospitalName}</td>
                <td style={th2}>청구기간</td><td style={td2}>{generatedInvoice.year}년 {generatedInvoice.month}월</td>
              </tr>
              <tr>
                <td style={th2}>공급자</td><td style={td2} colSpan={3}>다사랑 간병공동체 (141-94-02083) | 충북 제천</td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#F5F5F5' }}>
                <th style={th}>간병인</th><th style={th}>근무일수</th><th style={th}>근무시간</th><th style={th}>시급</th><th style={th}>금액</th>
              </tr>
            </thead>
            <tbody>
              {generatedInvoice.items.map((it, i) => (
                <tr key={i} style={{ background: i%2===0?'#FAFAFA':'white' }}>
                  <td style={td}>{it.caregiverName}</td>
                  <td style={td}>{it.days}일</td>
                  <td style={td}>{it.hours}시간</td>
                  <td style={td}>{fmt(it.hourlyRate)}원</td>
                  <td style={{...td, fontWeight:700, color:'#2D5A3D'}}>{fmt(it.amount)}원</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 0', borderTop: '3px solid #333', fontWeight: 800, fontSize: '1.2rem', gap: '2rem' }}>
            <span>합 계</span>
            <span style={{ color: '#2D5A3D' }}>￦ {fmt(generatedInvoice.totalAmount)}</span>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right', fontSize: '0.85rem', color: '#888' }}>
            작성일: {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>
      )}

      {/* 저장된 청구서 목록 */}
      <h3 style={{ color: '#2D5A3D', marginBottom: '1rem', fontSize: '1.1rem' }}>📋 저장된 청구서</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#F5F5F5' }}>
              <th style={th}>기간</th><th style={th}>병원</th><th style={th}>간병인</th><th style={th}>청구금액</th><th style={th}>상태</th><th style={th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>📭 청구서가 없습니다</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} style={{ background: inv.status==='paid'?'#FAFAFA':'white' }}>
                  <td style={td}>{inv.year}년 {inv.month}월</td>
                  <td style={{...td, fontWeight:600}}>{inv.hospitalName}</td>
                  <td style={td}>{inv.items.length}명</td>
                  <td style={{...td, fontWeight:700, color:'#2D5A3D'}}>{fmt(inv.totalAmount)}원</td>
                  <td style={td}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '0.25rem',
                      background: STATUS_COLOR[inv.status]+'18', color: STATUS_COLOR[inv.status],
                      fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap',
                    }}>{STATUS_OPT[inv.status]}</span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {inv.status === 'draft' && (
                        <button onClick={() => handleStatus(inv.id, 'sent')} style={btnSm}>📤 발송</button>
                      )}
                      {inv.status === 'sent' && (
                        <button onClick={() => handleStatus(inv.id, 'paid')} style={{...btnSm, background:'#2D5A3D'}}>✅ 입금</button>
                      )}
                      {inv.status !== 'paid' && inv.status !== 'sent' && (
                        <button onClick={() => handleStatus(inv.id, 'paid')} style={{...btnSm, background:'#2D5A3D'}}>✅ 입금</button>
                      )}
                      <button onClick={() => handleDelete(inv.id)} style={{...btnSm, background:'#C62828'}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`@media print {
        html,body{background:white!important;background-image:none!important}
        .no-print{display:none!important}
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        body{font-size:10px}
        table{font-size:9px}
        .invoice{border:2px solid #333!important;padding:10mm!important}
      }`}</style>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding:'0.5rem 1.25rem',background:'#2D5A3D',color:'#fff',border:'none',borderRadius:'0.5rem',fontSize:'0.875rem',fontWeight:700,cursor:'pointer' };
const btnCancel: React.CSSProperties = { ...btnPrimary, background:'#999' };
const btnSm: React.CSSProperties = { padding:'0.25rem 0.5rem',background:'#1565C0',color:'#fff',border:'none',borderRadius:'0.3rem',fontSize:'0.75rem',cursor:'pointer' };
const selStyle: React.CSSProperties = { padding:'0.4rem 0.6rem',border:'1px solid #CCC',borderRadius:'0.4rem',fontSize:'0.85rem' };
const th: React.CSSProperties = { padding:'0.5rem',border:'1px solid #DDD',fontWeight:700,textAlign:'center',whiteSpace:'nowrap',fontSize:'0.8rem' };
const td: React.CSSProperties = { padding:'0.5rem',border:'1px solid #EEE',textAlign:'center',verticalAlign:'middle' };
const td2: React.CSSProperties = { ...td, textAlign:'left',padding:'0.5rem 0.75rem' };
const th2: React.CSSProperties = { ...th, background:'#F5F5F5',width:'14%' };
