'use client';

import { useState } from 'react';

export default function BizRegPage() {
  const handlePrint = () => {
    const prev = document.title;
    document.title = '제천다사랑간병사업자등록증';
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <div className="no-print">
        <h2 style={{ color: '#4A7C59', marginBottom: '1.5rem' }}>🏢 사업자등록증</h2>
      </div>

      <div style={{ textAlign: 'center', background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #4A7C59' }}>
        <img
          src="/biz-reg.jpg"
          alt="사업자등록증"
          style={{ maxWidth: '100%', height: 'auto' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div id="img-fallback" style={{ display: 'none', padding: '2rem', color: '#999' }}>
          사업자등록증 이미지가 없습니다.<br />
          <code>public/biz-reg.jpg</code> 파일을 확인해주세요.
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={handlePrint} style={{
          padding: '0.75rem 2rem', background: '#4A7C59', color: 'white',
          border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
        }}>
          🖨️ 인쇄 / PDF 저장
        </button>
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          img { max-height: 270mm; width: auto; object-fit: contain; }
        }
      `}</style>
    </div>
  );
}
