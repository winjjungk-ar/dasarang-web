'use client';

export default function FloatingPhone() {
  const phoneNumber = '010-2275-1946';

  return (
    <div className="no-print" style={{
      position: 'fixed',
      bottom: '7rem',
      left: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
    }}>
      <a
        href={`tel:${phoneNumber}`}
        style={{
          width: '3.75rem',
          height: '3.75rem',
          borderRadius: '50%',
          background: '#5B8C5A',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          textDecoration: 'none',
          transition: 'transform 0.2s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        📞
      </a>
      <span style={{
        fontSize: '0.6875rem',
        color: '#6B7280',
        fontWeight: 600,
        background: 'rgba(255,255,255,0.85)',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.5rem',
        whiteSpace: 'nowrap',
      }}>
        전화 상담
      </span>
    </div>
  );
}
