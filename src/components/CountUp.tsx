'use client';

import { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
  icon: string;
  color?: string;
  highlight?: boolean;
}

export default function CountUp({ end, suffix = '', prefix = '', duration = 2000, label, icon, color = '#4A7C59', highlight = false }: CountUpProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return (
    <div ref={ref} style={{
      background: 'white',
      borderRadius: '1.25rem',
      padding: highlight ? '2rem 1.25rem' : '1.75rem 1.25rem',
      textAlign: 'center',
      boxShadow: highlight
        ? '0 8px 30px rgba(230, 81, 0, 0.12), 0 2px 8px rgba(139, 119, 90, 0.08)'
        : '0 3px 14px rgba(139, 119, 90, 0.07)',
      border: highlight ? '2px solid #FFCC80' : '1px solid #F0E8D8',
      position: 'relative',
    }}>
      {highlight && (
        <div style={{
          position: 'absolute',
          top: '-0.625rem',
          right: '-0.625rem',
          background: '#E65100',
          color: 'white',
          padding: '0.2rem 0.625rem',
          borderRadius: '1rem',
          fontSize: '0.6875rem',
          fontWeight: 'bold',
        }}>
          ★ BEST
        </div>
      )}
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: 'bold',
        color: color,
        marginBottom: '0.25rem',
      }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>{label}</div>
    </div>
  );
}
