'use client';

export default function FloatingHome() {
  return (
    <div className="no-print" style={{
      position: 'fixed',
      top: '0.75rem',
      left: '0.75rem',
      zIndex: 9999,
    }}>
      <a href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        padding: '0.5rem 0.75rem',
        borderRadius: '2rem',
        color: '#4A7C59',
        textDecoration: 'none',
        fontSize: '0.8125rem',
        fontWeight: 700,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; }}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '1rem' }}>🏠</span>
        HOME
      </a>
    </div>
  );
}
