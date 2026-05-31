'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface InquiryData {
  id: string;
  title: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  hospital?: string;
  disease?: string;
  careNeeds?: string;
  careStartDate?: string;
  kakaoId?: string;
  contactPhone?: string;
  content?: string;
  password: string;
  status: string;
  answer?: string | null;
  createdAt: { seconds: number };
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'inquiries', id as string));
        if (!snap.exists()) {
          toast.error('게시글을 찾을 수 없습니다');
          router.push('/inquiry');
          return;
        }
        setInquiry({ id: snap.id, ...snap.data() } as InquiryData);
      } catch (err) {
        toast.error('오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const checkPassword = () => {
    if (!inquiry) return;
    setChecking(true);
    if (password === inquiry.password) {
      setUnlocked(true);
      toast.success('확인되었습니다 💚');
    } else {
      toast.error('비밀번호가 일치하지 않습니다');
    }
    setChecking(false);
  };

  const deleteThis = async () => {
    if (!confirm('정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    try {
      await deleteDoc(doc(db, 'inquiries', id as string));
      toast.success('삭제되었습니다');
      router.push('/inquiry');
    } catch {
      toast.error('삭제 실패');
    }
  };

  const formatDate = (ts: { seconds: number }) => {
    const d = new Date(ts.seconds * 1000);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 50%, #F5F0E8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          불러오는 중...
        </div>
      </div>
    );
  }

  if (!inquiry) return null;

  if (!unlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 50%, #F5F0E8 100%)',
        padding: '3rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '28rem',
          width: '100%',
          background: 'white',
          borderRadius: '1.25rem',
          padding: '2.5rem 2rem',
          boxShadow: '0 4px 24px rgba(139, 119, 90, 0.12)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{
            fontSize: '1.375rem',
            fontWeight: 'bold',
            color: '#5B8C5A',
            marginBottom: '0.5rem',
          }}>비밀번호 확인</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            게시글 작성 시 설정한 비밀번호를 입력해주세요
          </p>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            onKeyDown={e => e.key === 'Enter' && checkPassword()}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              border: '1.5px solid #E8D5C4',
              background: '#FFFDF7',
              fontSize: '1.125rem',
              letterSpacing: '0.25rem',
              textAlign: 'center',
              outline: 'none',
              marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => router.push('/inquiry')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '1.5px solid #E8D5C4',
                background: 'white',
                color: '#6B5E4A',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '0.9375rem',
              }}>
              목록으로
            </button>
            <button onClick={checkPassword} disabled={checking || !password}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: checking ? '#A0C4A0' : '#5B8C5A',
                color: 'white',
                fontWeight: 'bold',
                cursor: checking ? 'not-allowed' : 'pointer',
                fontSize: '0.9375rem',
                boxShadow: '0 2px 8px rgba(91, 140, 90, 0.3)',
              }}>
              {checking ? '확인 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string }> = {
      '접수됨': { bg: '#E8F5E9', color: '#388E3C', text: '✅ 접수됨' },
      '상담중': { bg: '#FFF3E0', color: '#E65100', text: '🔄 상담중' },
      '완료됨': { bg: '#E3F2FD', color: '#1565C0', text: '✔️ 완료됨' },
    };
    return map[status] || map['접수됨'];
  };
  const st = statusStyle(inquiry.status);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 50%, #F5F0E8 100%)',
      padding: '3rem 1rem',
    }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        {/* 상단 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <Link href="/inquiry" style={{
            color: '#6B5E4A',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            ← 목록으로
          </Link>
          <span style={{
            padding: '0.375rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            background: st.bg,
            color: st.color,
          }}>{st.text}</span>
        </div>

        {/* 제목 */}
        <div style={{
          background: 'white',
          borderRadius: '1rem 1rem 0 0',
          padding: '1.5rem',
          boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          borderBottom: '1px solid #F0E8D8',
        }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 'bold', color: '#3D3929' }}>
            {inquiry.title}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
            {formatDate(inquiry.createdAt)}
          </p>
        </div>

        {/* 환자 정보 */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          borderBottom: '1px solid #F0E8D8',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span>🏥</span> 환자 정보
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: '환자 성명', value: inquiry.patientName },
              { label: '연령', value: inquiry.patientAge },
              { label: '성별', value: inquiry.patientGender },
              { label: '병원명', value: inquiry.hospital },
              { label: '질환/상태', value: inquiry.disease },
              { label: '희망 시작일', value: inquiry.careStartDate },
            ].filter(item => item.value).map(item => (
              <div key={item.label}>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'block' }}>{item.label}</span>
                <span style={{ fontSize: '0.9375rem', color: '#3D3929', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 간병 내용 */}
        {(inquiry.careNeeds || inquiry.content) && (
          <div style={{
            background: 'white',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
            borderBottom: '1px solid #F0E8D8',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem' }}>
              📝 간병 내용
            </h3>
            {inquiry.careNeeds && (
              <p style={{ color: '#3D3929', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: inquiry.content ? '1rem' : 0 }}>
                {inquiry.careNeeds}
              </p>
            )}
            {inquiry.content && (
              <p style={{ color: '#3D3929', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {inquiry.content}
              </p>
            )}
          </div>
        )}

        {/* 답변 */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0 0 1rem 1rem',
          boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span>💚</span> 답변
          </h3>
          {inquiry.answer ? (
            <div style={{
              background: '#F5F9F5',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              color: '#3D3929',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {inquiry.answer}
            </div>
          ) : (
            <div style={{
              background: '#FFFDF7',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              color: '#9CA3AF',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
              아직 답변이 등록되지 않았습니다.<br />
              <span style={{ fontSize: '0.8125rem' }}>24시간 이내에 답변드리겠습니다</span>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          marginTop: '1.5rem',
        }}>
          <Link href="/inquiry" style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            border: '1.5px solid #E8D5C4',
            color: '#6B5E4A',
            fontWeight: 500,
            textDecoration: 'none',
            fontSize: '0.9375rem',
          }}>
            목록으로 돌아가기
          </Link>
          <button onClick={deleteThis} style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            border: '1px solid #FCA5A5',
            background: 'none',
            color: '#DC2626',
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: '0.9375rem',
          }}>
            🗑️ 삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}