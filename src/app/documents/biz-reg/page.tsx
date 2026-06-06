'use client';

import { useState } from 'react';

export default function BizRegPage() {
  const handlePrint = () => {
    // 기존 인쇄용 div 제거
    const oldDiv = document.getElementById('print-container');
    if (oldDiv) oldDiv.remove();
    const oldStyle = document.getElementById('print-style');
    if (oldStyle) oldStyle.remove();

    // 인쇄용 CSS: 모든 요소 숨기고 print-container만 표시
    const style = document.createElement('style');
    style.id = 'print-style';
    style.textContent = `@media print {
      @page { size: A4; margin: 0mm; }
      body > *:not(#print-container) { display: none !important; }
      #print-container { display: block !important; position: absolute; top: 0; left: 0; width: 210mm; }
    }`;
    document.head.appendChild(style);

    // 인쇄용 콘텐츠 div
    const div = document.createElement('div');
    div.id = 'print-container';
    div.style.cssText = 'display:none;position:absolute;top:0;left:0;width:210mm;background:white;font-family:sans-serif;';
    div.innerHTML = `<style>
    * { margin:0;padding:0;box-sizing:border-box; }
    html, body { width:210mm;height:297mm;margin:0;padding:0;overflow:hidden;background:white; }
    img { width:210mm;height:297mm;object-fit:contain; }
    </style>
    <img src="${window.location.origin}/biz-reg.jpg" alt="사업자등록증"
      onerror="this.style.display='none';this.parentElement.innerHTML='<div style=padding:20mm;text-align:center;color:#999;font-size:5mm>사업자등록증 이미지가 없습니다.<br><br><code>public/biz-reg.jpg</code> 파일을 추가해주세요.</div>'"/>`;
    document.body.appendChild(div);

    // 렌더링 후 인쇄
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        div.remove();
        style.remove();
      }, 1000);
    }, 200);
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
