'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Transaction {
  id: string; date: string; type: 'income' | 'expense';
  amount: number; category: string; note: string;
}

const INCOME_CATS = ['간병비', '보조금', '기타수입'];
const EXPENSE_CATS = ['급여', '사무실', '교통비', '식대', '보험료', '세금', '기타지출'];

export default function PLPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selMonth, setSelMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [mode, setMode] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selQuarter, setSelQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc')));
      const list: Transaction[] = [];
      snap.forEach(d => {
        const dt = d.data();
        list.push({ id: d.id, date: dt.date || '', type: dt.type || 'expense', amount: dt.amount || 0, category: dt.category || '', note: dt.note || '' });
      });
      setTransactions(list);
      setLoading(false);
    })();
  }, []);

  // 기간 필터링
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const [y, m] = t.date.split('-').map(Number);
      if (y !== selYear) return false;
      if (mode === 'monthly' && selMonth !== null) return m === selMonth;
      if (mode === 'quarterly') {
        const q = Math.ceil(m / 3);
        return q === selQuarter;
      }
      return true; // yearly
    });
  }, [transactions, selYear, selMonth, mode, selQuarter]);

  // 카테고리별 집계
  const incomeByCat = useMemo(() => {
    const map: Record<string, number> = {};
    INCOME_CATS.forEach(c => { map[c] = 0; });
    filtered.filter(t => t.type === 'income').forEach(t => {
      const cat = t.category || '기타수입';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map).filter(([, v]) => v > 0).sort(([,a], [,b]) => b - a);
  }, [filtered]);

  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {};
    EXPENSE_CATS.forEach(c => { map[c] = 0; });
    filtered.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || '기타지출';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map).filter(([, v]) => v > 0).sort(([,a], [,b]) => b - a);
  }, [filtered]);

  const totalIncome = useMemo(() => incomeByCat.reduce((s, [,v]) => s + v, 0), [incomeByCat]);
  const totalExpense = useMemo(() => expenseByCat.reduce((s, [,v]) => s + v, 0), [expenseByCat]);
  const netProfit = totalIncome - totalExpense;

  // SVG 바 차트 데이터
  const maxVal = Math.max(totalIncome, totalExpense, 1);
  const barW = (v: number) => Math.max((v / maxVal) * 100, 1);

  const fmt = (n: number) => n.toLocaleString();
  const periodLabel = mode === 'monthly' ? `${selYear}년 ${selMonth}월`
    : mode === 'quarterly' ? `${selYear}년 ${selQuarter}분기`
    : `${selYear}년`;

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D5A3D', margin: 0 }}>📈 손익계산서 (P&L)</h2>
        <div style={{ flex: 1 }} />
        {(['monthly', 'quarterly', 'yearly'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
            background: mode === m ? '#2D5A3D' : '#E8F0E8', color: mode === m ? '#fff' : '#555',
          }}>{m === 'monthly' ? '📆 월별' : m === 'quarterly' ? '📊 분기별' : '📅 연간'}</button>
        ))}
      </div>

      {/* 기간 선택 */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={sel} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        {mode === 'monthly' && (
          <select style={sel} value={selMonth!} onChange={e => setSelMonth(Number(e.target.value))}>
            {Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}월</option>)}
          </select>
        )}
        {mode === 'quarterly' && (
          <select style={sel} value={selQuarter} onChange={e => setSelQuarter(Number(e.target.value))}>
            {[1,2,3,4].map(q=><option key={q} value={q}>{q}분기</option>)}
          </select>
        )}
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: '총 수입', value: `${fmt(totalIncome)}원`, color: '#2D5A3D', bg: '#E8F5E9' },
          { label: '총 지출', value: `${fmt(totalExpense)}원`, color: '#C62828', bg: '#FFEBEE' },
          { label: '순이익', value: `${netProfit >= 0 ? '+' : ''}${fmt(netProfit)}원`, color: netProfit >= 0 ? '#1565C0' : '#C62828', bg: netProfit >= 0 ? '#E3F2FD' : '#FFEBEE' },
          { label: '이익률', value: totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : '-', color: '#6A1B9A', bg: '#F3E5F5' },
        ].map(card => (
          <div key={card.label} style={{ padding: '1rem', background: card.bg, borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 바 차트 */}
      {filtered.length > 0 && (
        <div className="no-print" style={{ padding: '1.5rem', background: 'white', borderRadius: '0.75rem', border: '1px solid #E0E0E0', marginBottom: '1.5rem' }}>
          <h4 style={{ color: '#555', marginBottom: '1rem', fontSize: '0.9rem' }}>📊 수입 vs 지출</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', justifyContent: 'center', height: '120px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2D5A3D' }}>{fmt(totalIncome)}</span>
              <div style={{ width: '60px', height: `${barW(totalIncome)}px`, background: '#2D5A3D', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s' }} />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>💰 수입</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C62828' }}>{fmt(totalExpense)}</span>
              <div style={{ width: '60px', height: `${barW(totalExpense)}px`, background: '#C62828', borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>💸 지출</span>
            </div>
          </div>
        </div>
      )}

      {/* P&L 상세 */}
      <div style={{ padding: '2rem', background: 'white', borderRadius: '0.75rem', border: '2px solid #333' }} className="pl-report">
        <h3 style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.2rem', marginBottom: '0.5rem' }}>
          손 익 계 산 서
        </h3>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
          {periodLabel} · 다사랑 간병공동체
        </p>

        {/* 수입 */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, color: '#2D5A3D', fontSize: '0.95rem', borderBottom: '2px solid #2D5A3D', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
            📈 수입 (Income)
          </div>
          {incomeByCat.length === 0 ? (
            <div style={{ color: '#999', fontSize: '0.85rem', padding: '0.5rem 0' }}>수입 내역 없음</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <tbody>
                {incomeByCat.map(([cat, amt]) => (
                  <tr key={cat}>
                    <td style={{ ...td2, textAlign: 'left' }}>{cat}</td>
                    <td style={{ ...td2, textAlign: 'right', fontWeight: 600 }}>{fmt(amt)}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', borderTop: '2px solid #2D5A3D', paddingTop: '0.25rem', color: '#2D5A3D' }}>
            <span>수입 합계</span><span>{fmt(totalIncome)}원</span>
          </div>
        </div>

        {/* 지출 */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, color: '#C62828', fontSize: '0.95rem', borderBottom: '2px solid #C62828', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
            📉 지출 (Expense)
          </div>
          {expenseByCat.length === 0 ? (
            <div style={{ color: '#999', fontSize: '0.85rem', padding: '0.5rem 0' }}>지출 내역 없음</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <tbody>
                {expenseByCat.map(([cat, amt]) => (
                  <tr key={cat}>
                    <td style={{ ...td2, textAlign: 'left' }}>{cat}</td>
                    <td style={{ ...td2, textAlign: 'right', fontWeight: 600 }}>{fmt(amt)}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', borderTop: '2px solid #C62828', paddingTop: '0.25rem', color: '#C62828' }}>
            <span>지출 합계</span><span>{fmt(totalExpense)}원</span>
          </div>
        </div>

        {/* 순이익 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontWeight: 800, fontSize: '1.1rem',
          padding: '0.75rem 0', borderTop: '3px solid #333',
          color: netProfit >= 0 ? '#1565C0' : '#C62828',
        }}>
          <span>당기순이익</span><span>{netProfit >= 0 ? '+' : ''}{fmt(netProfit)}원</span>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={() => window.print()} style={{
          padding: '0.75rem 2rem', background: '#4A7C59', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
        }}>🖨️ 손익계산서 인쇄</button>
      </div>

      <style jsx>{`@media print {
        html,body{background:white!important;background-image:none!important}
        .no-print{display:none!important}
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        body{font-size:10px}
        .pl-report{border:2px solid #333!important;padding:10mm!important}
      }`}</style>
    </div>
  );
}

const sel: React.CSSProperties = { padding: '0.4rem 0.6rem', border: '1px solid #CCC', borderRadius: '0.4rem', fontSize: '0.85rem' };
const td2: React.CSSProperties = { padding: '0.35rem 0.75rem', verticalAlign: 'middle' };
