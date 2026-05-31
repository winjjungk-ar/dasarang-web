'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function RecruitPage() {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    experience: '',
    introduce: '',
    region: '',
    password: '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('이름과 연락처는 필수입니다');
      return;
    }
    if (!form.password || form.password.length < 4) {
      toast.error('비밀번호는 4자리 이상 입력해주세요');
      return;
    }
    if (!agreed) {
      toast.error('개인정보 수집에 동의해주세요');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        type: 'recruit',
        title: `[간병인 지원] ${form.name}`,
        ...form,
        status: '접수됨',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast.success('지원서가 접수되었습니다! 💚\\n24시간 이내에 연락드리겠습니다');
      setForm({ name: '', phone: '', experience: '', introduce: '', region: '', password: '' });
      setAgreed(false);
    } catch {
      toast.error('오류가 발생했습니다. 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    border: '1.5px solid #E8D5C4',
    background: '#FFFDF7',
    color: '#3D3929',
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#6B5E4A',
    marginBottom: '0.5rem',
  };

  return (
    <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤝</div>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '0.75rem',
        }}>
          간병인 모집
        </h1>
        <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.6 }}>
          따뜻한 손길로 환자분들을 돌볼 정성 어린 간병인을 모십니다
        </p>
      </div>

      {/* 모집 포인트 */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF3E0, #FFF8E1)',
        borderRadius: '1.25rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '2px solid #FFCC80',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{
            background: '#E65100',
            color: 'white',
            padding: '0.3rem 0.875rem',
            borderRadius: '1.5rem',
            fontSize: '0.8125rem',
            fontWeight: 'bold',
          }}>
            🔥 긴급 모집
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.75rem',
        }}>
          {[
            { icon: '💰', title: '경쟁력 있는 급여', desc: '경력·근무 시간별 차등' },
            { icon: '📅', title: '탄력 근무', desc: '주간/야간/24시간 선택' },
            { icon: '🎓', title: '무료 교육', desc: '40시간 전문 교육 제공' },
            { icon: '💚', title: '따뜻한 환경', desc: '가족 같은 분위기' },
          ].map(item => (
            <div key={item.title} style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '0.875rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 'bold', color: '#3D3929', fontSize: '0.8125rem', marginBottom: '0.125rem' }}>{item.title}</div>
              <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 지원 자격 */}
      <div style={{
        background: 'white',
        borderRadius: '1.25rem',
        padding: '1.5rem',
        boxShadow: '0 3px 14px rgba(139, 119, 90, 0.07)',
        marginBottom: '2rem',
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '1rem',
        }}>
          ✅ 지원 자격
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            '간병 경험 또는 요양보호사 자격증 소지자 우대',
            '환자를 내 가족처럼 대하는 따뜻한 마음',
            '정직하고 책임감 있는 분',
            '충주·제천·영월 지역 거주 또는 출퇴근 가능자',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#3D3929', fontSize: '0.875rem', lineHeight: 1.5 }}>
              <span style={{ color: '#7BAE7F', flexShrink: 0 }}>•</span> {item}
            </div>
          ))}
        </div>
      </div>

      {/* 지원 폼 */}
      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'white',
          borderRadius: '1.25rem',
          padding: '1.5rem',
          boxShadow: '0 3px 14px rgba(139, 119, 90, 0.07)',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#4A7C59',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            <span>📝</span> 지원서 작성
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>이름 *</label>
              <input type="text" required value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="홍길동" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>연락처 *</label>
              <input type="tel" required value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="010-0000-0000" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>거주 지역</label>
            <input type="text" value={form.region}
              onChange={e => update('region', e.target.value)}
              placeholder="예: 충주시, 제천시" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>간병 경력</label>
            <textarea value={form.experience}
              onChange={e => update('experience', e.target.value)}
              rows={3} placeholder="간병 경력, 자격증, 근무 기간 등을 자유롭게 적어주세요"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>자기소개</label>
            <textarea value={form.introduce}
              onChange={e => update('introduce', e.target.value)}
              rows={3} placeholder="간병에 대한 생각, 각오 등을 자유롭게 적어주세요"
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

                  {/* 비밀번호 */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            boxShadow: '0 2px 10px rgba(139, 119, 90, 0.05)',
            marginBottom: '1rem',
            border: '1px dashed #D4C9B0',
          }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6B5E4A',
              marginBottom: '0.5rem',
            }}>
              🔒 비밀번호 *
            </label>
            <input type="password" required value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="4자리 이상 입력해주세요"
              minLength={4}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                border: '1.5px solid #E8D5C4',
                background: 'white',
                fontSize: '1.125rem',
                letterSpacing: '0.25rem',
                outline: 'none',
                boxSizing: 'border-box' as const,
              }} />
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.375rem' }}>
              📌 관리자 확인 시 필요합니다. 잊지 않도록 메모해두세요!
            </p>
          </div>

        {/* 개인정보 동의 */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          boxShadow: '0 2px 10px rgba(139, 119, 90, 0.05)',
          marginBottom: '1.5rem',
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5 }}>
            <input type="checkbox" checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '0.25rem', width: '1rem', height: '1rem', accentColor: '#E65100', flexShrink: 0 }} />
            <span>개인정보 수집 및 이용에 동의합니다. <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>입력하신 정보는 채용 목적으로만 사용됩니다.</span></span>
          </label>
        </div>

        {/* 제출 버튼 */}
        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '1.125rem',
          background: loading ? '#FFB38A' : '#E65100',
          color: 'white',
          border: 'none',
          borderRadius: '1rem',
          fontSize: '1.125rem',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 16px rgba(230, 81, 0, 0.3)',
          transition: 'all 0.2s',
        }}>
          {loading ? '⏳ 접수 중...' : '🤝 간병인 지원하기'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#9CA3AF', marginTop: '0.75rem' }}>
          접수 후 24시간 이내에 연락드리겠습니다
        </p>
      </form>
    </div>
  );
}