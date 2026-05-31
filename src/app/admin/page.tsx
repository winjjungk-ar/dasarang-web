'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Inquiry {
  id: string;
  type?: string;
  title: string;
  patientName?: string;
  name?: string;
  phone?: string;
  contactPhone?: string;
  kakaoId?: string;
  hospital?: string;
  status: string;
  answer?: string | null;
  createdAt: { seconds: number };
  content?: string;
  experience?: string;
  introduce?: string;
  region?: string;
}

const ADMIN_PASSWORD='dasarang2024';

const maskName = (name: string) => {
  if (!name || name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
};

const maskPhone = (phone: string) => {
  if (!phone) return phone;
  return phone.replace(/(\d{2,3})-\d+(-\d+)/, '$1-****$2');
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'inquiry' | 'recruit'>('all');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving] = useState(false);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      toast.error('비밀번호가 틀렸습니다');
    }
  };

  useEffect(() => {
    if (!authed) return;
    (async () => {
      try {
        const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Inquiry)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authed]);

  const filtered = inquiries.filter(i => {
    if (tab === 'recruit') return i.type === 'recruit';
    if (tab === 'inquiry') return i.type !== 'recruit';
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status, updatedAt: Timestamp.now() });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
      toast.success(`상태: ${status}`);
    } catch {
      toast.error('오류 발생');
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      setInquiries(prev => prev.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('삭제되었습니다');
    } catch {
      toast.error('삭제 실패');
    }
  };

  const submitAnswer = async () => {
    if (!selected || !answerText.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'inquiries', selected.id), {
        answer: answerText,
        status: '완료됨',
        updatedAt: Timestamp.now(),
      });
      setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, answer: answerText, status: '완료됨' } : i));
      setSelected(prev => prev ? { ...prev, answer: answerText, status: '완료됨' } : null);
      setAnswerText('');
      toast.success('답변이 등록되었습니다 💚');
    } catch {
      toast.error('오류 발생');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (ts: { seconds: number }) => {
    const d = new Date(ts.seconds * 1000);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      '접수됨': { bg: '#E8F5E9', color: '#388E3C' },
      '상담중': { bg: '#FFF3E0', color: '#E65100' },
      '완료됨': { bg: '#E3F2FD', color: '#1565C0' },
    };
    const s = map[status] || map['접수됨'];
    return (
      <span style={{ padding: '0.2rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  // Login screen
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #FEFBF6, #FFF9EE)' }}>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '24rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4A7C59', marginBottom: '0.5rem' }}>관리자 로그인</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1.5rem' }}>비밀번호를 입력하세요</p>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="비밀번호"
            autoFocus
            style={{
              width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem',
              border: '1.5px solid #E8D5C4', fontSize: '1.125rem', textAlign: 'center',
              outline: 'none', marginBottom: '1rem', boxSizing: 'border-box',
            }} />
          <button onClick={login} style={{
            width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
            border: 'none', background: '#5B8C5A', color: 'white',
            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
          }}>
            로그인
          </button>
        </div>
      </div>
    );
  }

  // Detail view
  if (selected) {
    const isRecruit = selected.type === 'recruit';
    return (
      <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
          ← 목록으로
        </button>
        <button onClick={() => { deleteInquiry(selected.id); }}
          style={{
            background: 'none', border: '1px solid #FCA5A5', color: '#DC2626', cursor: 'pointer',
            fontSize: '0.8125rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
            marginLeft: '0.5rem', marginBottom: '1.5rem',
          }}>
          🗑️ 삭제
        </button>

        <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 3px 14px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3D3929' }}>
              {isRecruit ? '🤝 ' : '📝 '}{selected.title}
            </h2>
            {statusBadge(selected.status)}
          </div>
          <div style={{ color: '#9CA3AF', fontSize: '0.8125rem', marginBottom: '1rem' }}>{formatDate(selected.createdAt)}</div>

          <div style={{ display: 'grid', gap: '0.75rem', padding: '1rem', background: '#FEFBF6', borderRadius: '0.75rem', marginBottom: '1rem' }}>
            {isRecruit ? (
              <>
                <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>이름</span><br /><span style={{ fontWeight: 500 }}>{maskName(selected.name || '') || '-'}</span></div>
                <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>연락처</span><br /><span style={{ fontWeight: 500 }}>{maskPhone(selected.phone || '') || '-'}</span></div>
                <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>거주 지역</span><br /><span style={{ fontWeight: 500 }}>{selected.region || '-'}</span></div>
                {selected.experience && <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>경력</span><br /><span style={{ whiteSpace: 'pre-wrap' }}>{selected.experience}</span></div>}
                {selected.introduce && <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>자기소개</span><br /><span style={{ whiteSpace: 'pre-wrap' }}>{selected.introduce}</span></div>}
              </>
            ) : (
              <>
                {selected.patientName && <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>환자명</span><br /><span style={{ fontWeight: 500 }}>{maskName(selected.patientName || '') || '-'}</span></div>}
                {(selected.phone || selected.contactPhone) && <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>연락처</span><br /><span style={{ fontWeight: 500 }}>{maskPhone(selected.phone || selected.contactPhone || '') || '-'}</span></div>}
                {selected.kakaoId && <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>카톡 ID</span><br /><span style={{ fontWeight: 500 }}>{selected.kakaoId}</span></div>}
                {selected.hospital && <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>병원</span><br /><span style={{ fontWeight: 500 }}>{selected.hospital}</span></div>}
                {selected.content && <div><span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>내용</span><br /><span style={{ whiteSpace: 'pre-wrap' }}>{selected.content}</span></div>}
              </>
            )}
          </div>

          {/* Status change */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['접수됨', '상담중', '완료됨'].map(s => (
              <button key={s} onClick={() => updateStatus(selected.id, s)}
                disabled={selected.status === s}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem', border: selected.status === s ? '2px solid #5B8C5A' : '1px solid #E8D5C4',
                  background: selected.status === s ? '#E8F5E9' : 'white', color: selected.status === s ? '#5B8C5A' : '#6B7280',
                  fontWeight: 500, fontSize: '0.8125rem', cursor: selected.status === s ? 'default' : 'pointer',
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* Answer */}
          {selected.answer ? (
            <div style={{ background: '#F0F7F0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginBottom: '0.375rem' }}>💚 등록된 답변</div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#3D3929' }}>{selected.answer}</div>
            </div>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <textarea value={answerText} onChange={e => setAnswerText(e.target.value)}
                placeholder="답변을 입력하세요..."
                rows={3}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1.5px solid #E8D5C4',
                  fontSize: '0.9375rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }} />
              <button onClick={submitAnswer} disabled={saving || !answerText.trim()}
                style={{
                  marginTop: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                  background: saving ? '#A0C4A0' : '#5B8C5A', color: 'white', fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9375rem',
                }}>
                {saving ? '저장 중...' : '💚 답변 등록하기'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4A7C59' }}>📊 관리자 페이지</h1>
        <div style={{ display: 'flex', gap: '0.375rem', background: '#F0E8D8', borderRadius: '0.75rem', padding: '0.25rem' }}>
          {[
            { key: 'all' as const, label: '전체' },
            { key: 'inquiry' as const, label: '📝 환자문의' },
            { key: 'recruit' as const, label: '🤝 간병인지원' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none',
                background: tab === t.key ? 'white' : 'transparent', color: tab === t.key ? '#4A7C59' : '#6B7280',
                fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>⏳ 불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>📭 내역이 없습니다</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(inq => (
            <div key={inq.id} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0.5rem',
              alignItems: 'center', padding: '0.75rem 1rem', background: 'white',
              borderRadius: '0.75rem', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            }}>
              <button onClick={() => setSelected(inq)} style={{
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const,
                padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.125rem',
              }}>
                <div style={{ fontWeight: 600, color: '#3D3929', fontSize: '0.9375rem' }}>
                  {inq.type === 'recruit' ? '🤝 ' : '📝 '}{inq.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                  {inq.type === 'recruit' ? maskName(inq.name || '') : maskName(inq.patientName || '')}
                  {inq.type === 'recruit' ? ` · ${maskPhone(inq.phone || '')}` : ''}
                </div>
              </button>
              {statusBadge(inq.status)}
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{inq.type === 'recruit' ? '지원' : '문의'}</span>
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{formatDate(inq.createdAt)}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteInquiry(inq.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem',
                  padding: '0.25rem', opacity: 0.5,
                }}
                title="삭제"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}