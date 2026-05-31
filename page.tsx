'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const cardStyle = {
  background: 'white',
  borderRadius: '1rem',
  padding: '1.5rem',
  boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
};

export default function InquiryDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [inquiry, setInquiry] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { router.push('/inquiry'); return; }

      const snap = await getDoc(doc(db, 'inquiries', params.id));
      if (!snap.exists()) { router.push('/inquiry'); return; }

      const data = snap.data();
      if (data.userId !== u.uid && data.userEmail !== 'admin@dasarang.com') {
        toast.error('접근 권한이 없습니다');
        router.push('/inquiry');
        return;
      }

      setInquiry({ id: snap.id, ...data });
      setLoading(false);
    });
  }, [params.id, router]);

  const handleAnswer = async () => {
    if (!answer.trim()) return;
    await updateDoc(doc(db, 'inquiries', params.id), {
      answer: answer.trim(),
      answerAt: Timestamp.now(),
      status: '답변완료',
      updatedAt: Timestamp.now(),
    });
    toast.success('답변이 등록되었습니다');
    setInquiry((prev: any) => ({ ...prev, answer: answer.trim(), status: '답변완료' }));
    setAnswer('');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FEFBF6, #FFF9EE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#5B8C5A' }}>로딩 중...</p>
    </div>
  );
  if (!inquiry) return null;

  const isAdmin = user?.email === 'admin@dasarang.com';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 100%)', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer',
          fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
        }}>
          ← 목록으로
        </button>

        {/* 문의 내용 */}
        <div style={{ ...cardStyle, marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#5B8C5A' }}>{inquiry.title}</h1>
            <span style={{
              fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem',
              background: inquiry.status === '답변완료' ? '#E8F5E9' : inquiry.status === '확인중' ? '#FFF3E0' : '#F3F4F6',
              color: inquiry.status === '답변완료' ? '#5B8C5A' : inquiry.status === '확인중' ? '#E65100' : '#6B7280',
              fontWeight: 500,
            }}>{inquiry.status}</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '1rem' }}>
            {inquiry.createdAt?.toDate?.()?.toLocaleString('ko-KR')} · {inquiry.userEmail}
          </p>

          <div style={{ color: '#3D3929', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            {inquiry.content}
          </div>

          {/* 환자 정보 */}
          {(inquiry.patientName || inquiry.kakaoId) && (
            <div style={{ background: '#FEFBF6', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem' }}>🏥 환자 정보</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                {[
                  ['성명', inquiry.patientName],
                  ['연령', inquiry.patientAge],
                  ['성별', inquiry.patientGender],
                  ['병원', inquiry.hospital],
                  ['질환', inquiry.disease],
                  ['필요 간병', inquiry.careNeeds],
                  ['희망 시작일', inquiry.careStartDate],
                  ['💬 카카오톡', inquiry.kakaoId],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string}>
                    <span style={{ color: '#9CA3AF' }}>{label}: </span>
                    <span style={{ color: '#3D3929', fontWeight: label === '💬 카카오톡' ? 500 : 'normal' }}>
                      {label === '💬 카카오톡' ? <strong>{value}</strong> : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 답변 */}
        {inquiry.answer && (
          <div style={{
            ...cardStyle,
            borderLeft: '4px solid #5B8C5A',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>💚</span>
              <h3 style={{ fontWeight: 'bold', color: '#5B8C5A' }}>관리자 답변</h3>
            </div>
            <p style={{ color: '#3D3929', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{inquiry.answer}</p>
            {inquiry.answerAt && (
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.75rem' }}>
                {inquiry.answerAt.toDate?.()?.toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        )}

        {/* 관리자 답변 입력 */}
        {isAdmin && !inquiry.answer && (
          <div style={cardStyle}>
            <h3 style={{ fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem' }}>답변 작성</h3>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={4}
              placeholder="답변을 입력하세요..."
              style={{
                width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem',
                border: '1.5px solid #E8D5C4', background: '#FFFDF7', color: '#3D3929',
                fontSize: '0.9375rem', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box' as const, marginBottom: '0.75rem',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleAnswer} style={{
                padding: '0.625rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                background: '#5B8C5A', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                fontSize: '0.875rem',
              }}>답변 등록</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
