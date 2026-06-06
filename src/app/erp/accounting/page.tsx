'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  createdAt: string;
}

const CATEGORIES = {
  income: ['간병비', '보조금', '기타수입'],
  expense: ['급여', '사무실', '교통비', '식대', '보험료', '세금', '기타지출'],
};

export default function AccountingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);

  // 등록 폼
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNote, setFormNote] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc')));
      const list: Transaction[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({ id: d.id, date: data.date || '', type: data.type || 'expense', amount: data.amount || 0, category: data.category || '', note: data.note || '', createdAt: data.createdAt || '' });
      });
      setTransactions(list);
    } catch { /* ignore */ }
    setLoading(false);
  };

  // 월별 필터
  const monthPrefix = `${selYear}-${String(selMonth).padStart(2, '0')}`;
  const filtered = useMemo(() =>
    transactions.filter(t => t.date.startsWith(monthPrefix)),
    [transactions, monthPrefix]);

  const summary = useMemo(() => {
    let income = 0, expense = 0;
    filtered.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  const resetForm = () => {
    setEditId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('income');
    setFormAmount('');
    setFormCategory('');
    setFormNote('');
  };

  const openEdit = (t: Transaction) => {
    setEditId(t.id);
    setFormDate(t.date);
    setFormType(t.type);
    setFormAmount(String(t.amount));
    setFormCategory(t.category);
    setFormNote(t.note);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formAmount || Number(formAmount) <= 0) { alert('금액을 입력해주세요'); return; }
    const data = {
      date: formDate,
      type: formType,
      amount: Number(formAmount),
      category: formCategory || (formType === 'income' ? '기타수입' : '기타지출'),
      note: formNote,
      createdAt: new Date().toISOString(),
    };
    try {
      if (editId) {
        await updateDoc(doc(db, 'transactions', editId), data as any);
      } else {
        await addDoc(collection(db, 'transactions'), data);
      }
      resetForm();
      setShowForm(false);
      loadTransactions();
    } catch (e) {
      alert('저장 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      loadTransactions();
    } catch { alert('삭제 실패'); }
  };

  // ── CSV 업로드 ──
  const [csvPreview, setCsvPreview] = useState<{ date: string; type: 'income' | 'expense'; amount: number; category: string; note: string }[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');

  const detectBank = (headers: string[]): string => {
    const h = headers.map(x => x.toLowerCase());
    if (h.includes('거래일시') || h.includes('거래일자')) return '국민';
    if (h.includes('입금액') && h.includes('출금액')) return '신한';
    if (h.includes('찾으신금액') || h.includes('맡기신금액')) return '우리';
    if (h.includes('입금') && h.includes('출금')) return '농협';
    return '일반';
  };

  const parseAmount = (raw: string): number => {
    if (!raw) return 0;
    return Number(raw.replace(/[,원\s]/g, '')) || 0;
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { alert('CSV 데이터가 부족합니다'); return; }

      // 헤더 파싱
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const bank = detectBank(headers);

      // 컬럼 매핑 찾기
      const findCol = (names: string[]) => {
        for (const n of names) {
          const idx = headers.findIndex(h => h.toLowerCase().includes(n.toLowerCase()));
          if (idx >= 0) return idx;
        }
        return -1;
      };

      const dateCol = findCol(['거래일', '일자', '날짜', 'date', '일시']);
      const contentCol = findCol(['내용', '적요', '거래내용', '비고', '메모', 'note']);
      const incomeCol = findCol(['입금', '입금액', '맡기신금액', 'credit']);
      const expenseCol = findCol(['출금', '출금액', '찾으신금액', '지급', 'debit']);
      // 대체: 단일 금액컬럼 + 입출금 구분 컬럼
      const amountCol = findCol(['금액', '거래금액', 'amount']);
      const typeCol = findCol(['입출금', '구분', 'type', '입출구분']);

      const preview: typeof csvPreview = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
        if (cols.length < 2) continue;

        let date = dateCol >= 0 ? cols[dateCol] : '';
        date = date.replace(/\./g, '-');
        if (date.length === 8) date = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;

        let type: 'income' | 'expense';
        let amount = 0;

        if (incomeCol >= 0 && expenseCol >= 0) {
          const inAmt = parseAmount(cols[incomeCol]);
          const exAmt = parseAmount(cols[expenseCol]);
          if (inAmt > 0) { type = 'income'; amount = inAmt; }
          else if (exAmt > 0) { type = 'expense'; amount = exAmt; }
          else continue;
        } else if (typeCol >= 0 && amountCol >= 0) {
          type = cols[typeCol].includes('입') ? 'income' : 'expense';
          amount = parseAmount(cols[amountCol]);
        } else if (amountCol >= 0) {
          amount = parseAmount(cols[amountCol]);
          type = amount >= 0 ? 'income' : 'expense';
          amount = Math.abs(amount);
        } else {
          continue;
        }

        if (!date || amount === 0) continue;

        const note = contentCol >= 0 ? cols[contentCol] : '';
        const category = type === 'income' ? '간병비' : '기타지출';

        preview.push({ date, type, amount, category, note });
      }

      if (preview.length === 0) {
        alert('인식된 내역이 없습니다. 은행 CSV 형식을 확인해주세요.');
        return;
      }
      setCsvPreview(preview);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCsvImport = async () => {
    if (csvPreview.length === 0) return;
    setCsvImporting(true);
    try {
      const batch = csvPreview.map(d =>
        addDoc(collection(db, 'transactions'), {
          ...d,
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(batch);
      setCsvPreview([]);
      setCsvFileName('');
      loadTransactions();
    } catch { alert('가져오기 실패'); }
    setCsvImporting(false);
  };

  const fmt = (n: number) => n.toLocaleString();
  const years = [2024, 2025, 2026, 2027];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D5A3D', margin: 0 }}>💳 입출금 관리</h2>
        <div style={{ flex: 1 }} />
        <select style={sel} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select style={sel} value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={btnPrimary}>+ 새 내역</button>
        <label style={{ ...btnPrimary, background: '#1565C0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          📂 CSV 가져오기
          <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: '총 수입', value: `${fmt(summary.income)}원`, color: '#2D5A3D', bg: '#E8F5E9' },
          { label: '총 지출', value: `${fmt(summary.expense)}원`, color: '#C62828', bg: '#FFEBEE' },
          { label: '순이익', value: `${summary.net >= 0 ? '+' : ''}${fmt(summary.net)}원`, color: summary.net >= 0 ? '#1565C0' : '#C62828', bg: summary.net >= 0 ? '#E3F2FD' : '#FFEBEE' },
          { label: '거래건수', value: `${filtered.length}건`, color: '#6A1B9A', bg: '#F3E5F5' },
        ].map(card => (
          <div key={card.label} style={{ padding: '1rem', background: card.bg, borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* CSV 미리보기 */}
      {csvPreview.length > 0 && (
        <div className="no-print" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#F0F7FF', borderRadius: '0.75rem', border: '2px solid #1565C0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#1565C0' }}>📂 {csvFileName}</span>
            <span style={{ fontSize: '0.85rem', color: '#555' }}>{csvPreview.length}건 인식됨</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => { setCsvPreview([]); setCsvFileName(''); }} style={btnCancel}>취소</button>
            <button onClick={handleCsvImport} disabled={csvImporting} style={{ ...btnPrimary, background: csvImporting ? '#999' : '#1565C0' }}>
              {csvImporting ? '⏳ 저장 중...' : `💾 ${csvPreview.length}건 가져오기`}
            </button>
          </div>
          <div style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '0.8125rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#E3F2FD', position: 'sticky', top: 0 }}>
                  <th style={{ ...td2, fontWeight: 700 }}>날짜</th>
                  <th style={{ ...td2, fontWeight: 700 }}>유형</th>
                  <th style={{ ...td2, fontWeight: 700 }}>금액</th>
                  <th style={{ ...td2, fontWeight: 700 }}>항목</th>
                  <th style={{ ...td2, fontWeight: 700 }}>내용</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#FAFAFA' : 'white' }}>
                    <td style={td2}>{d.date}</td>
                    <td style={{ ...td2, color: d.type === 'income' ? '#2D5A3D' : '#C62828', fontWeight: 600 }}>
                      {d.type === 'income' ? '💰 수입' : '💸 지출'}
                    </td>
                    <td style={{ ...td2, fontWeight: 600, textAlign: 'right' }}>{fmt(d.amount)}원</td>
                    <td style={td2}>{d.category}</td>
                    <td style={{ ...td2, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#666' }}>{d.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className="no-print" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0' }}>
          <h4 style={{ color: '#2D5A3D', marginBottom: '0.75rem' }}>{editId ? '✏️ 내역 수정' : '➕ 새 입출금 등록'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>날짜</label>
              <input type="date" style={inp} value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>유형</label>
              <select style={inp} value={formType} onChange={e => { setFormType(e.target.value as any); setFormCategory(''); }}>
                <option value="income">💰 수입</option>
                <option value="expense">💸 지출</option>
              </select>
            </div>
            <div>
              <label style={lbl}>금액 (원)</label>
              <input type="number" style={inp} value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div>
              <label style={lbl}>항목</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <select style={inp} value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                  <option value="">선택</option>
                  {CATEGORIES[formType].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input style={{ ...inp, flex: 1 }} value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="직접입력" />
              </div>
            </div>
            <div>
              <label style={lbl}>비고</label>
              <input style={inp} value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="메모 (선택)" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); resetForm(); }} style={btnCancel}>취소</button>
            <button onClick={handleSubmit} style={btnPrimary}>{editId ? '수정' : '등록'}</button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#F5F5F5' }}>
              {['날짜', '유형', '금액', '항목', '비고', '관리'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.5rem', border: '1px solid #DDD', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>📭 이번 달 내역이 없습니다</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} style={{ background: t.type === 'income' ? '#FAFFFA' : '#FFFAFA' }}>
                  <td style={td2}>{t.date}</td>
                  <td style={{ ...td2, fontWeight: 600, color: t.type === 'income' ? '#2D5A3D' : '#C62828' }}>
                    {t.type === 'income' ? '💰 수입' : '💸 지출'}
                  </td>
                  <td style={{ ...td2, fontWeight: 700, textAlign: 'right', color: t.type === 'income' ? '#2D5A3D' : '#C62828' }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}원
                  </td>
                  <td style={td2}>{t.category}</td>
                  <td style={{ ...td2, color: '#888', fontSize: '0.8rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note || '-'}</td>
                  <td style={td2}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button onClick={() => openEdit(t)} style={btnSm}>✏️</button>
                      <button onClick={() => handleDelete(t.id)} style={{ ...btnSm, background: '#C62828' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}

const sel: React.CSSProperties = { padding: '0.4rem 0.6rem', border: '1px solid #CCC', borderRadius: '0.4rem', fontSize: '0.85rem' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: '0.2rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #D0D8D0', borderRadius: '0.4rem', fontSize: '0.875rem', boxSizing: 'border-box' };
const td2: React.CSSProperties = { padding: '0.5rem', border: '1px solid #EEE', textAlign: 'center', verticalAlign: 'middle' };
const btnPrimary: React.CSSProperties = { padding: '0.5rem 1rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' };
const btnCancel: React.CSSProperties = { padding: '0.5rem 1rem', background: '#EEE', color: '#555', border: 'none', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' };
const btnSm: React.CSSProperties = { padding: '0.25rem 0.5rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' };
