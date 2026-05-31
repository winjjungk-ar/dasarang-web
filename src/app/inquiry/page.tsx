'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

interface Inquiry {
  id: string;
  title: string;
  patientName?: string;
  hospital?: string;
  status: string;
  createdAt: { seconds: number };
  careNeeds?: string;
}

export default function InquiryListPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setInquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string }> = {
      '접수됨': { bg: '#E8F5E9', color: '#388E3C', text: '접수됨' },
      '상담중': { bg: '#FFF3E0', color: '#E65100', text: '상담중' },
      '완료됨': { bg: '#E3F2FD', color: '#1565C0', text: '완료됨' },
    };
    return map[status] || map['접수됨'];
  };

  const formatDate = (ts: { seconds: number }) => {
    const d = new Date(ts.seconds * 1000);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 50%, #F5F0E8 100%)',
      padding: '3rem 1rem',
    }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.625rem',
              fontWeight: 'bold',
              color: '#5B8C5A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>📋</span> 문의 게시판
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              간병 문의를 남겨주시면 빠르게 답변드리겠습니다
            </p>
          </div>
          <Link href="/inquiry/new" style={{
            display: 'inline-block',
            background: '#5B8C5A',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            fontWeight: 'bold',
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(91, 140, 90, 0.3)',
            transition: 'all 0.2s',
          }}>
            ✏️ 문의 작성하기
          </Link>
        </div>

        {/* 게시글 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9CA3AF' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            불러오는 중...
          </div>
        ) : inquiries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.5rem' }}>
              아직 등록된 문의가 없습니다
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              첫 번째 문의를 남겨주세요!
            </p>
            <Link href="/inquiry/new" style={{
              display: 'inline-block',
              background: '#5B8C5A',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              fontWeight: '500',
              textDecoration: 'none',
            }}>
              문의 작성하기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {/* 테이블 헤더 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 80px 90px',
              padding: '0.75rem 1.25rem',
              background: '#F5EFE3',
              borderRadius: '0.75rem',
              fontWeight: 'bold',
              fontSize: '0.8125rem',
              color: '#6B5E4A',
            }}>
              <span>제목</span>
              <span style={{ textAlign: 'center' }}>상태</span>
              <span style={{ textAlign: 'center' }}>지역</span>
              <span style={{ textAlign: 'center' }}>날짜</span>
            </div>

            {inquiries.map((inq) => {
              const st = statusStyle(inq.status);
              return (
                <Link key={inq.id} href={`/inquiry/${inq.id}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 80px 90px',
                  padding: '1rem 1.25rem',
                  background: 'white',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 1px 6px rgba(139, 119, 90, 0.05)',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFFDF7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <span style={{
                      fontWeight: 600,
                      color: '#3D3929',
                      fontSize: '0.9375rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{inq.title}</span>
                    {inq.careNeeds && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#9CA3AF',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '0.125rem',
                      }}>{inq.careNeeds}</span>
                    )}
                  </div>
                  <span style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.5rem',
                    background: st.bg,
                    color: st.color,
                  }}>{st.text}</span>
                  <span style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#9CA3AF',
                  }}>{inq.hospital || '-'}</span>
                  <span style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#9CA3AF',
                  }}>{formatDate(inq.createdAt)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}