'use client';

import { useState } from 'react';

export default function FloatingKakao() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    const kakaoId = 'dasarang';

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      try {
        window.location.href = `kakaotalk://plusfriend/home/${kakaoId}`;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(kakaoId);
      setCopied(true);
      setMessage('복사 완료! 카톡에서 친구 추가해주세요 💚');
      setTimeout(() => {
        setCopied(false);
        setMessage('');
      }, 3000);
    } catch {
      setCopied(true);
      setMessage(`카톡 ID: ${kakaoId}`);
      setTimeout(() => {
        setCopied(false);
        setMessage('');
      }, 4000);
    }
  };

  return (
    <div className="no-print" style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
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
        onMouseEnter={(e) => { setShowTooltip(true); e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { setShowTooltip(false); e.currentTarget.style.transform = 'scale(1)'; }}
        style={{
          width: '3.75rem',
          height: '3.75rem',
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
          position: 'relative',
        }}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
      </button>

      {/* Label with 1분 badge */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}>
        <span style={{
          fontSize: '0.625rem',
          color: 'white',
          fontWeight: 700,
          background: '#DC2626',
          padding: '1px 6px',
          borderRadius: '1rem',
          lineHeight: '1.3',
        }}>
          ⚡ 1분 상담
        </span>
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
    </div>
  );
}
