'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import CheckinContent from './CheckinContent';

export default function CheckinPage() {
  return (
    <>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>}>
        <CheckinContent />
      </Suspense>
      <div style={{ maxWidth: '500px', margin: '2rem auto 0', padding: '1rem', borderTop: '1px solid #E0E0E0' }}>
        <Link href="/erp" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.5rem 1rem', background: '#2D5A3D', color: '#fff',
          borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.85rem',
          fontWeight: 600,
        }}>
          ← ERP 메인
        </Link>
      </div>
    </>
  );
}
