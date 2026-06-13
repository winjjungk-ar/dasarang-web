'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getCaregivers, getHospitals, getPatients, type Caregiver, type Hospital, type Patient } from '@/lib/caregiverStore';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function ERPDashboard() {
  const [cgCount, setCgCount] = useState(0);
  const [hospCount, setHospCount] = useState(0);
  const [patCount, setPatCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [cgList, hospList, patList] = await Promise.all([getCaregivers(), getHospitals(), getPatients()]);
      setCgCount(cgList.length);
      setHospCount(hospList.length);
      setPatCount(patList.length);
      const today = new Date().toISOString().split('T')[0];
      const snap = await getDocs(query(collection(db, 'attendance'), orderBy('date', 'desc')));
      let todayC = 0;
      snap.forEach(d => {
        if (d.data().date === today) todayC++;
      });
      setTodayCount(todayC);
      setLoading(false);
    })();
  }, []);

  const modules = [
    { href: '/erp/schedule', icon: '📋', title: '배차·스케줄', desc: '간병인 배정 / 일정 관리', color: '#D84315', stat: `${todayCount}건`, statLabel: '오늘 출퇴근' },
    { href: '/erp/attendance', icon: '⏱️', title: '출퇴근 관리', desc: '간병인 출퇴근 기록 / 통계', color: '#2D5A3D', stat: `${cgCount}명`, statLabel: '등록 간병인' },
    { href: '/erp/invoice', icon: '🧾', title: '병원별 청구서', desc: '월간 간병비 자동 계산', color: '#1565C0', stat: '발행', statLabel: '청구서' },
    { href: '/checkin', icon: '📱', title: '체크인 (QR)', desc: '간병인 핸드폰 출퇴근', color: '#1565C0', stat: '바로가기', statLabel: 'QR 스캔' },
    { href: '/documents/employment-cert', icon: '📜', title: '재직증명서', desc: '재직증명서 발급', color: '#6A1B9A', stat: '발급', statLabel: '문서 출력' },
    { href: '/documents/care-log', icon: '📋', title: '간병일지', desc: '일일 간병 기록', color: '#E65100', stat: '작성', statLabel: '일지 작성' },
    { href: '/documents/confirmation', icon: '✅', title: '사용 확인서', desc: '보험사 제출용', color: '#00838F', stat: '발급', statLabel: '확인서' },
    { href: '/documents/caregivers', icon: '👩‍⚕️', title: '간병인·병원·환자 등록', desc: `${cgCount}명 간병인 / ${hospCount}곳 병원 / ${patCount}명 환자`, color: '#C62828', stat: '관리', statLabel: '인력 관리' },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
      <div style={{ color: '#999' }}>ERP 로딩 중...</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2D5A3D', marginBottom: '0.25rem' }}>
          다사랑 ERP 대시보드
        </h2>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          등록 간병인 {cgCount}명 · 병원 {hospCount}곳 · 환자 {patCount}명 · 오늘 출퇴근 {todayCount}건
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}>
        {modules.map(m => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '1.5rem', borderRadius: '1rem', background: 'white',
              border: `2px solid ${m.color}20`, transition: 'all 0.2s',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem',
              minHeight: '140px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  fontSize: '2rem', width: '3rem', height: '3rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${m.color}15`, borderRadius: '0.75rem',
                }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#333' }}>{m.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{m.desc}</div>
                </div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingTop: '0.75rem', borderTop: `1px solid ${m.color}15`,
              }}>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>{m.statLabel}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: m.color }}>{m.stat}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
