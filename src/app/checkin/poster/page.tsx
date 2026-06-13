'use client';

import { useState, useEffect } from 'react';

export default function CheckinPosterPage() {
  const [origin, setOrigin] = useState('');
  const [hospital, setHospital] = useState('');
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const checkinUrl = `${origin}/checkin`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=2D5A3D&data=${encodeURIComponent(checkinUrl)}`;

  if (!showPoster) {
    return (
      <div className="no-print" style={{
        maxWidth: '500px', margin: '4rem auto', padding: '2rem',
        background: 'white', borderRadius: '1rem',
        border: '2px solid #2D5A3D20',
      }}>
        <h2 style={{ color: '#2D5A3D', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
          🏥 QR 체크인 포스터 만들기
        </h2>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          A4 용지에 인쇄해서 병원 간병인실에 붙이면,<br />
          간병인분들이 핸드폰 카메라로 찍어서 바로 출퇴근 체크인!
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
            병원 이름 (선택)
          </label>
          <input
            type="text"
            value={hospital}
            onChange={e => setHospital(e.target.value)}
            placeholder="예: 제천성모병원"
            style={{
              width: '100%', padding: '0.75rem 1rem',
              border: '1px solid #CCC', borderRadius: '0.5rem',
              fontSize: '1rem', boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.4rem' }}>
            비워두면 "다사랑 간병공동체"로 표시됩니다
          </p>
        </div>

        <button
          onClick={() => setShowPoster(true)}
          style={{
            width: '100%', padding: '1rem',
            background: '#2D5A3D', color: 'white',
            border: 'none', borderRadius: '0.5rem',
            fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          📱 포스터 미리보기
        </button>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#FFF9C4', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#F57F17' }}>
          💡 <strong>사용 방법</strong><br />
          ① 병원 이름 입력 → 포스터 보기<br />
          ② Ctrl+P (인쇄) → A4 출력<br />
          ③ 병원 간병인실 벽에 붙이기<br />
          ④ 간병인: 핸드폰 카메라로 찍고 → 이름 누르고 → 출근/퇴근!
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 인쇄용 포스터 */}
      <div style={{
        width: '210mm', minHeight: '297mm',
        margin: '0 auto', padding: '20mm',
        background: 'white',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', gap: '4mm',
        boxSizing: 'border-box',
      }}>
        {/* 헤더 */}
        <div style={{
          fontSize: '2.5rem', fontWeight: 900,
          color: '#2D5A3D', letterSpacing: '0.2rem',
          marginBottom: '3mm',
        }}>
          다사랑 간병공동체
        </div>

        <div style={{
          fontSize: '1.3rem', fontWeight: 700,
          color: '#555', marginBottom: '8mm',
        }}>
          {hospital || '간병인 출퇴근 체크인'}
        </div>

        {/* QR 코드 */}
        <div style={{
          border: '3px solid #2D5A3D',
          borderRadius: '3mm', padding: '5mm',
          background: 'white',
        }}>
          <img
            src={qrUrl}
            alt="QR 체크인"
            style={{ width: '90mm', height: '90mm', display: 'block' }}
          />
        </div>

        {/* 안내문 */}
        <div style={{
          fontSize: '2rem', fontWeight: 800,
          color: '#C62828', marginTop: '6mm',
        }}>
          핸드폰 카메라로 찍으세요!
        </div>

        <div style={{
          fontSize: '1.2rem', color: '#555',
          lineHeight: '1.7', marginTop: '4mm',
          fontWeight: 600,
        }}>
          📱 앱 설치 없이 바로 체크인<br />
          ① QR 코드 사진 찍기<br />
          ② 내 이름 찾아서 누르기<br />
          ③ 출근 / 퇴근 끝!
        </div>

        {/* 하단 정보 */}
        <div style={{
          marginTop: '10mm', padding: '4mm 8mm',
          borderTop: '2px solid #DDD',
          fontSize: '0.85rem', color: '#999',
        }}>
          문의: 010-2275-1946 · dasarangcare.co.kr<br />
          다사랑 간병공동체 (사업자 141-94-02083)
        </div>
      </div>

      {/* 인쇄 버튼 (화면에만) */}
      <div className="no-print" style={{
        position: 'fixed', bottom: '2rem', left: '50%',
        transform: 'translateX(-50%)', zIndex: 1000,
        display: 'flex', gap: '0.75rem',
      }}>
        <button
          onClick={() => setShowPoster(false)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#EEE', color: '#555',
            border: 'none', borderRadius: '0.5rem',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          ← 수정하기
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: '0.75rem 2rem',
            background: '#2D5A3D', color: 'white',
            border: 'none', borderRadius: '0.5rem',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          🖨️ A4 인쇄하기
        </button>
      </div>

      <style jsx global>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            background-image: none !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          .no-print { display: none !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media screen {
          body {
            background: #F5F5F5;
          }
        }
      `}</style>
    </div>
  );
}
