'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DOCUMENTS = [
  { id: 1, name: '간병인 재직증명서', href: '/documents/employment-cert', icon: '📋' },
  { id: 2, name: '간병일지', href: '/documents/care-log', icon: '📝' },
  { id: 3, name: '간병인 사용 확인서', href: '/documents/confirmation', icon: '✅' },
  { id: 4, name: '사업자등록증', href: '/documents/biz-reg', icon: '🏢' },
  { id: 5, name: '거래 명세서', href: '/documents/transaction-cert', icon: '💰' },
];

const INSURANCE_COMPANIES = [
  '삼성화재', 'DB손해보험', '현대해상', 'KB손해보험', '메리츠화재', '한화손해보험', '롯데손해보험', '흥국화재',
];

export default function InsurancePage() {
  const [selectedIns, setSelectedIns] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [savedEmails, setSavedEmails] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('insurance_emails');
      if (stored) setSavedEmails(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleSelectIns = (ins: string) => {
    setSelectedIns(ins);
    setCustomEmail(savedEmails[ins] || '');
  };

  const saveEmail = () => {
    if (!selectedIns || !customEmail) return;
    const updated = { ...savedEmails, [selectedIns]: customEmail };
    setSavedEmails(updated);
    localStorage.setItem('insurance_emails', JSON.stringify(updated));
  };

  const toggleCheck = (id: number) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const allChecked = DOCUMENTS.every(d => checked[d.id]);
  const checkedCount = DOCUMENTS.filter(d => checked[d.id]).length;

  const [printing, setPrinting] = useState(false);
  const [step, setStep] = useState('');

  const handleOpenAll = async () => {
    const urls = [
      '/documents/employment-cert',
      '/documents/care-log',
      '/documents/confirmation',
      '/documents/biz-reg',
      '/documents/transaction-cert',
    ];
    const names = ['재직증명서', '간병일지', '사용확인서', '사업자등록증', '거래명세서'];

    setPrinting(true);

    for (let i = 0; i < urls.length; i++) {
      setStep(`${i + 1}/5 ${names[i]} — 인쇄 다이얼로그가 뜨면 PDF로 저장 후 창을 닫아주세요`);

      const w = window.open(urls[i], 'print_doc');
      if (!w || w.closed) {
        alert(`「${names[i]}」팝업이 차단되었습니다.\n브라우저 팝업 차단을 해제해주세요.`);
        setPrinting(false);
        setStep('');
        return;
      }

      // 페이지 로딩 기다린 후 자동 인쇄
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          try { w.print(); } catch { /* ignore */ }
        }, 1200);

        // 창 닫힐 때까지 대기 (최대 3분)
        const check = setInterval(() => {
          if (w.closed) { clearInterval(check); resolve(); }
        }, 400);
        setTimeout(() => { clearInterval(check); resolve(); }, 180000);
      });
    }

    setPrinting(false);
    setStep('');
    alert('✅ 5종 출력이 완료되었습니다!');
  };

  const insEmail = selectedIns ? customEmail : '';
  const subject = `[간병서류 제출] 간병서류 5종`;
  const body = [
    `안녕하세요, 다사랑 간병공동체입니다.`,
    ``,
    `간병서류 5종을 제출합니다.`,
    ``,
    `첨부: 재직증명서, 간병일지, 사용확인서, 사업자등록증, 거래명세서`,
    ``,
    `감사합니다.`,
    `다사랑 간병공동체 (141-94-02083)`,
  ].join('\n');
  const mailtoHref = insEmail
    ? `mailto:${insEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : '#';

  return (
    <div>
      <h2 style={{ color: '#2D5A3D', marginBottom: '0.5rem' }}>📮 보험회사 서류 제출</h2>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        각 서류 페이지에서 내용을 입력/저장한 후, 순차 출력으로 5종을 한 번에 PDF로 저장하세요.
      </p>

      {/* 서류 목록 + 체크리스트 */}
      <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#F8FAF8', borderRadius: '0.75rem', border: '1px solid #E0E8E0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ color: '#2D5A3D', fontSize: '0.95rem', margin: 0 }}>📎 제출 서류 5종</h3>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: allChecked ? '#2D5A3D' : '#888' }}>
            {checkedCount}/5 {allChecked ? '✓ 완료!' : ''}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {DOCUMENTS.map(doc => (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem', background: checked[doc.id] ? '#E8F5E9' : 'white',
              borderRadius: '0.5rem', border: `1px solid ${checked[doc.id] ? '#4CAF50' : '#E0E0E0'}`,
              cursor: 'pointer',
            }} onClick={() => toggleCheck(doc.id)}>
              <span style={{ fontSize: '1.2rem' }}>{checked[doc.id] ? '✅' : '⬜'}</span>
              <span style={{ fontSize: '1.3rem' }}>{doc.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2D5A3D' }}>{doc.name}</div>
                <Link href={doc.href} target="_blank" onClick={e => e.stopPropagation()}
                  style={{ fontSize: '0.75rem', color: '#1565C0', textDecoration: 'none' }}>📝 작성하러 가기</Link>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleOpenAll} disabled={printing} style={{
          width: '100%', padding: '0.85rem', background: printing ? '#999' : '#C62828', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontSize: '1.05rem', fontWeight: 700,
          cursor: printing ? 'not-allowed' : 'pointer', opacity: printing ? 0.7 : 1,
        }}>
          {printing ? `⏳ ${step}` : '🖨️ 5종 순차 출력 (하나씩 인쇄 → PDF 저장)'}
        </button>
        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem', textAlign: 'center' }}>
          {printing ? '인쇄 다이얼로그에서 [PDF로 저장] 선택 후 창을 닫으면 다음 서류로 넘어갑니다' : '버튼 클릭 → 서류 하나씩 새 창 열림 → 인쇄 → PDF 저장 → 창 닫기 → 다음'}
        </p>
      </div>

      {/* 이메일 제출 */}
      <div className="no-print" style={{ padding: '1.25rem', background: '#FAFAFA', borderRadius: '0.75rem', border: '1px solid #E0E0E0' }}>
        <h3 style={{ color: '#2D5A3D', fontSize: '0.95rem', marginBottom: '0.75rem' }}>✉️ 이메일로 제출</h3>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={{ ...inp, width: 'auto', minWidth: '160px' }} value={selectedIns} onChange={e => handleSelectIns(e.target.value)}>
            <option value="">보험사 선택</option>
            {INSURANCE_COMPANIES.map(ins => (
              <option key={ins} value={ins}>{ins}{savedEmails[ins] ? ' 💾' : ''}</option>
            ))}
          </select>
          <input style={{ ...inp, flex: 1, minWidth: '220px' }}
            value={customEmail}
            onChange={e => setCustomEmail(e.target.value)}
            placeholder={selectedIns ? `${selectedIns} 담당자 이메일` : '이메일 직접 입력'}
          />
          {selectedIns && customEmail && (
            <button onClick={saveEmail} style={{
              padding: '0.45rem 0.75rem', background: savedEmails[selectedIns] === customEmail ? '#CCC' : '#1565C0',
              color: 'white', border: 'none', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600,
              cursor: savedEmails[selectedIns] === customEmail ? 'default' : 'pointer',
            }}>
              {savedEmails[selectedIns] === customEmail ? '✓ 저장됨' : '💾 저장'}
            </button>
          )}
        </div>
        {Object.keys(savedEmails).length > 0 && (
          <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>저장됨:</span>
            {Object.entries(savedEmails).map(([ins, email]) => (
              <button key={ins} onClick={() => { setSelectedIns(ins); setCustomEmail(email); }} style={{
                padding: '0.25rem 0.6rem', background: selectedIns === ins ? '#E8F5E9' : '#F5F5F5',
                border: `1px solid ${selectedIns === ins ? '#4CAF50' : '#DDD'}`,
                borderRadius: '0.3rem', fontSize: '0.75rem', cursor: 'pointer', color: selectedIns === ins ? '#2D5A3D' : '#555',
              }}>
                {ins}: {email}
              </button>
            ))}
          </div>
        )}
        {insEmail ? (
          <a href={mailtoHref} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.75rem 1.5rem', background: '#1565C0', color: 'white',
            borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 700,
          }}>
            ✉️ 메일 보내기 ({selectedIns})
          </a>
        ) : (
          <button disabled style={{ padding: '0.75rem 1.5rem', background: '#CCC', color: '#888', border: 'none', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 700, cursor: 'not-allowed' }}>
            ✉️ 보험사와 이메일을 입력하세요
          </button>
        )}
        {insEmail && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#FFF9C4', borderRadius: '0.4rem', fontSize: '0.8rem', color: '#F57F17' }}>
            💡 PDF 파일을 이메일에 직접 첨부해주세요. (메일 클라이언트에서 [파일 첨부] 클릭)
          </div>
        )}
      </div>

      <style jsx>{`@media print {
        html, body {
          background: white !important;
          background-image: none !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print { display: none !important; } }`}</style>
    </div>
  );
}

const inp: React.CSSProperties = { padding: '0.45rem 0.6rem', border: '1px solid #D0D8D0', borderRadius: '0.4rem', fontSize: '0.875rem', boxSizing: 'border-box' };
