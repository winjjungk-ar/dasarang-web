'use client';

import { useState } from 'react';

export default function FloatingKakao() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    const kakaoId = 'dasarang';

    // 모바일에서 카카오톡 앱 열기 시도
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // 카톡 앱 열기 시도 (실패해도 복사는 함)
      try {
        window.location.href = `kakaotalk://plusfriend/home/${kakaoId}`;
      } catch {}
    }

    // 클립보드에 ID 복사
    try {
      await navigator.clipboard.writeText(kakaoId);
      setCopied(true);
      setMessage('복사 완료! 카톡에서 친구 추가해주세요 💚');
      setTimeout(() => {
        setCopied(false);
        setMessage('');
      }, 3000);
    } catch {
      // 클립보드 실패 시 수동 표시
      setCopied(true);
      setMessage(`카톡 ID: ${kakaoId}`);
      setTimeout(() => {
        setCopied(false);
        setMessage('');
      }, 4000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
    }}>
      {/* Tooltip */}
      {(showTooltip || copied) && (
        <div style={{
          background: 'white',
          padding: copied ? '0.75rem 1rem' : '0.625rem 0.875rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          fontSize: '0.8125rem',
          color: '#3D3929',
          whiteSpace: 'nowrap',
          maxWidth: '16rem',
          textAlign: 'center',
        }}>
          {copied ? (
            <span>{message || '✅ 복사 완료!'}</span>
          ) : (
            <span>
              💬 <strong>카톡 상담하기</strong><br />
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>클릭하면 ID가 복사됩니다</span>
            </span>
          )}
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: '#FEE500',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'transform 0.2s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
      </button>

      {/* Label */}
      <span style={{
        fontSize: '0.6875rem',
        color: '#6B7280',
        fontWeight: 600,
        background: 'rgba(255,255,255,0.85)',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.5rem',
      }}>
        카톡 상담
      </span>
    </div>
  );
}
