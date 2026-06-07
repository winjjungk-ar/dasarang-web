'use client';

import { useState } from 'react';

export default function BizRegPage() {
  const handlePrint = () => {
    // iframe 방식 — 팝업 차단 우회
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const printWindow = iframe.contentWindow!;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>사업자등록증</title>
  <style>
    @page { size: A4; margin: 0mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { display: flex; justify-content: center; align-items: center; margin: 0; padding: 0; background: white; }
    img { max-width: 190mm; max-height: 287mm; object-fit: contain; }
  </style>
</head>
<body>
  <img src="${window.location.origin}/biz-reg.jpg" alt="사업자등록증"
    onerror="this.style.display='none';document.body.innerHTML='<div style=padding:20mm;text-align:center;color:#999;font-size:5mm>사업자등록증 이미지가 없습니다.<br><br><code>public/biz-reg.jpg</code> 파일을 추가해주세요.</div>'"/>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    // setTimeout으로 DOM 파싱 완료 후 print() 호출 (모바일 "미리보기 준비중" 방지)
    setTimeout(() => {
      printWindow.print();
    }, 200);
    printWindow.onafterprint = () => { setTimeout(() => iframe.remove(), 500); };
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
