'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function NewInquiryPage() {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    hospital: '',
    disease: '',
    careNeeds: '',
    careStartDate: '',
    contactPhone: '',
    kakaoId: '',
    password: '',
    content: '',
  });

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    border: '1.5px solid #E8D5C4',
    background: '#FFFDF7',
    color: '#3D3929',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#6B5E4A',
    marginBottom: '0.5rem',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error('개인정보 수집에 동의해주세요');
      return;
    }
    if (!form.password || form.password.length < 4) {
      toast.error('비밀번호는 4자리 이상 입력해주세요');
      return;
    }
    setLoading(true);

    try {
      await addDoc(collection(db, 'inquiries'), {
        ...form,
        status: '접수됨',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        answer: null,
      });
      toast.success('문의가 접수되었습니다 💚\n답변은 24시간 이내에 드리겠습니다');
      router.push('/inquiry');
    } catch (err) {
      toast.error('오류가 발생했습니다. 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 50%, #F5F0E8 100%)',
      padding: '3rem 1rem',
    }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💚</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.5rem' }}>
            문의 작성
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
            간병이 필요하신 분을 위해 최선을 다해 상담해 드리겠습니다
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 문의 제목 */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          }}>
            <label style={labelStyle}>문의 제목 *</label>
            <input type="text" required value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="예: 어머니 간병 문의드립니다"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#7BAE7F'; e.target.style.boxShadow = '0 0 0 3px rgba(123, 174, 127, 0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#E8D5C4'; e.target.style.boxShadow = 'none'; }}
            />
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
              💡 문의 내용을 잘 나타내는 제목을 적어주시면 더 빠른 상담이 가능합니다
            </p>
          </div>

          {/* 환자 정보 */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#5B8C5A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>🏥</span> 환자 정보
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>환자 성명 *</label>
                <input type="text" required value={form.patientName} onChange={e => update('patientName', e.target.value)}
                  placeholder="홍길동" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>연령</label>
                <input type="text" value={form.patientAge} onChange={e => update('patientAge', e.target.value)}
                  placeholder="75세" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>성별</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['남성', '여성'].map(g => (
                  <button key={g} type="button"
                    onClick={() => update('patientGender', g)}
                    style={{
                      padding: '0.75rem 2rem',
                      borderRadius: '0.75rem',
                      border: form.patientGender === g ? '2px solid #5B8C5A' : '1.5px solid #E8D5C4',
                      background: form.patientGender === g ? '#E8F5E9' : '#FFFDF7',
                      color: form.patientGender === g ? '#5B8C5A' : '#9CA3AF',
                      fontWeight: 500,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>병원명</label>
                <input type="text" value={form.hospital} onChange={e => update('hospital', e.target.value)}
                  placeholder="예: 제천서울병원" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>질환/상태</label>
                <input type="text" value={form.disease} onChange={e => update('disease', e.target.value)}
                  placeholder="예: 뇌졸중 후유증" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>필요한 간병 내용 *</label>
              <textarea value={form.careNeeds} required onChange={e => update('careNeeds', e.target.value)}
                rows={3} placeholder="예: 식사보조, 배변보조, 24시간 상주 간병"
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>희망 간병 시작일</label>
                <input type="date" value={form.careStartDate} onChange={e => update('careStartDate', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>연락처 *</label>
                <input type="tel" required value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)}
                  placeholder="010-0000-0000" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* 연락처 정보 */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#5B8C5A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>📞</span> 연락처 정보
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                💬 카카오톡 ID
              </label>
              <input type="text" value={form.kakaoId} onChange={e => update('kakaoId', e.target.value)}
                placeholder="예: dasarang" style={inputStyle} />
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.375rem' }}>
                카카오톡 ID를 남겨주시면 더 빠르게 상담드릴 수 있습니다
              </p>
            </div>

            {/* 비밀번호 - 게시판 스타일 */}
            <div style={{
              background: '#FFFDF7',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              border: '1px dashed #D4C9B0',
            }}>
              <label style={{
                ...labelStyle,
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                🔒 비밀번호 *
              </label>
              <input type="password" required value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="4자리 이상 입력해주세요"
                style={{
                  ...inputStyle,
                  background: 'white',
                  fontSize: '1.125rem',
                  letterSpacing: '0.25rem',
                }}
                minLength={4}
                onFocus={e => { e.target.style.borderColor = '#7BAE7F'; e.target.style.boxShadow = '0 0 0 3px rgba(123, 174, 127, 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#E8D5C4'; e.target.style.boxShadow = 'none'; }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.375rem' }}>
                📌 게시글 확인 시 필요합니다. 잊지 않도록 메모해두세요!
              </p>
            </div>
          </div>

          {/* 추가 내용 */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          }}>
            <label style={labelStyle}>추가 문의사항</label>
            <textarea value={form.content} onChange={e => update('content', e.target.value)}
              rows={4} placeholder="추가로 궁금하신 점이나 전달사항을 자유롭게 적어주세요"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* 개인정보 동의 */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 12px rgba(139, 119, 90, 0.06)',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#6B7280',
              lineHeight: 1.5,
            }}>
              <input type="checkbox" checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{
                  marginTop: '0.25rem',
                  width: '1.125rem',
                  height: '1.125rem',
                  accentColor: '#5B8C5A',
                  flexShrink: 0,
                }}
              />
              <span>
                개인정보 수집 및 이용에 동의합니다. <br />
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                  입력하신 정보는 간병 상담 목적으로만 사용되며, 상담 완료 후 안전하게 파기됩니다.
                </span>
              </span>
            </label>
          </div>

          {/* 제출 버튼 */}
          <button type="submit" disabled={loading}
            style={{
              width: '100%',
              padding: '1.125rem',
              background: loading ? '#A0C4A0' : '#5B8C5A',
              color: 'white',
              border: 'none',
              borderRadius: '1rem',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(91, 140, 90, 0.3)',
              transition: 'all 0.2s',
              letterSpacing: '0.05rem',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#4A7C59'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#5B8C5A'; e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            {loading ? '⏳ 접수 중...' : '💚 문의 접수하기'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#9CA3AF', marginTop: '-0.5rem' }}>
            접수 후 24시간 이내에 답변드리겠습니다
          </p>
        </form>
      </div>
    </div>
  );
}