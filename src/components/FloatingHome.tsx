'use client';

export default function FloatingHome() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
    }}>
      <a href="/" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '50%',
        background: '#5B8C5A',
        color: 'white',
        textDecoration: 'none',
        fontSize: '1.5rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        transition: 'transform 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        🏠
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
        HOME
      </span>
    </div>
  );
}
