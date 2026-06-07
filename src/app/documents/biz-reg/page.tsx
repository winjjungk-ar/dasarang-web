'use client';

import { useState } from 'react';

export default function BizRegPage() {
  const handlePrint = () => {
    // iframe 방식 — 팝업 차단 우회
    // Blob URL 방식 — 실제 페이지 로드로 @page 정상 작동
    const html = `
<html>
<head>
  <meta charset="utf-8">
  <title>사업자등록증</title>
  <style>
    @page { size: A4; margin: 0mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden; background: white; }
    img { width: 190mm; height: 277mm; margin: 10mm 10mm; object-fit: contain; }
  </style>
</head>
<body>
  <img src="${window.location.origin}/biz-reg.jpg" alt="사업자등록증"
    onerror="this.style.display='none';document.body.innerHTML='<div style=padding:20mm;text-align:center;color:#999;font-size:5mm>사업자등록증 이미지가 없습니다.<br><br><code>public/biz-reg.jpg</code> 파일을 추가해주세요.</div>'"/>
</body>
</html>`);
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) { window.print(); return; }
    w.onload = () => {
      w.print();
      w.onafterprint = () => { w.close(); URL.revokeObjectURL(url); };
    };
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
          html, body {
            background: white !important;
            background-image: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          img { max-height: 270mm; width: auto; object-fit: contain; }
        }
      `}</style>
    </div>
  );
}
