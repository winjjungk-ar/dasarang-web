'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { getCaregivers, type Caregiver } from '@/lib/caregiverStore';

export default function CheckinContent() {
  const params = useSearchParams();
  const cgId = params.get('cg');

  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecords, setTodayRecords] = useState<Record<string, { id: string; clockIn: string; clockOut: string }>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false); // 자동처리 완료 여부
  const autoFired = useRef(false);

  const today = new Date().toISOString().split('T')[0];
  const nowHour = new Date().getHours();
  const nowStr = String(nowHour).padStart(2, '0');

  const showMsg = (msg: string) => {
    setMessage(msg);
  };

  // 출퇴근 처리 코어 로직
  const doCheckin = async (cg: Caregiver): Promise<string> => {
    try {
      const existing = todayRecords[cg.id];
      if (existing && existing.clockOut) {
        return `${cg.name}님은 오늘 이미 퇴근하셨습니다 (${existing.clockIn}시~${existing.clockOut}시)`;
      } else if (existing) {
        await updateDoc(doc(db, 'attendance', existing.id), {
          clockOut: nowStr,
          totalHours: Math.max(0, nowHour - parseInt(existing.clockIn)),
        });
        setTodayRecords(prev => ({ ...prev, [cg.id]: { ...prev[cg.id], clockOut: nowStr } }));
        return `✅ ${cg.name}님 퇴근 완료! (${nowStr}시)`;
      } else {
        const docRef = await addDoc(collection(db, 'attendance'), {
          caregiverId: cg.id,
          caregiverName: cg.name,
          hospitalName: '',
          date: today,
          clockIn: nowStr,
          clockOut: '',
          totalHours: 0,
          createdAt: new Date().toISOString(),
        });
        setTodayRecords(prev => ({ ...prev, [cg.id]: { id: docRef.id, clockIn: nowStr, clockOut: '' } }));
        return `✅ ${cg.name}님 출근 완료! (${nowStr}시)`;
      }
    } catch (e) {
      return '오류가 발생했습니다. 다시 시도해주세요.';
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      const list = await getCaregivers();
      setCaregivers(list);
      if (list.length > 0) {
        const snap = await getDocs(query(collection(db, 'attendance'), where('date', '==', today)));
        const map: typeof todayRecords = {};
        snap.forEach(d => {
          const data = d.data();
          map[data.caregiverId] = { id: d.id, clockIn: data.clockIn, clockOut: data.clockOut };
        });
        setTodayRecords(map);
      }
      setLoading(false);
    })();
  }, []);

  // 링크로 들어왔을 때 자동 출퇴근 처리
  useEffect(() => {
    if (loading || !cgId || autoFired.current) return;
    const targetCg = caregivers.find(c => c.id === cgId);
    if (!targetCg) return;

    autoFired.current = true;
    setChecking(cgId);

    // 약간의 지연을 두고 자동 처리 (데이터 로드 완료 확인)
    const timer = setTimeout(async () => {
      const msg = await doCheckin(targetCg);
      showMsg(msg);
      setDone(true);
      setChecking(null);
    }, 500);

    return () => clearTimeout(timer);
  }, [loading, cgId, caregivers, todayRecords]);

  const handleCheckin = async (cg: Caregiver) => {
    setChecking(cg.id);
    const msg = await doCheckin(cg);
    showMsg(msg);
    setDone(true);
    setChecking(null);
  };

  const getStatus = (cgId: string) => {
    const r = todayRecords[cgId];
    if (!r) return { text: '미출근', color: '#999', bg: '#F5F5F5' };
    if (r.clockOut) return { text: `${r.clockIn}시~${r.clockOut}시 퇴근완료`, color: '#888', bg: '#E8F5E9' };
    return { text: `🟢 ${r.clockIn}시 출근 중`, color: '#2D5A3D', bg: '#C8E6C9' };
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>⏳ 로딩 중...</div>;

  const targetCg = cgId ? caregivers.find(c => c.id === cgId) : null;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h2 style={{ textAlign: 'center', color: '#2D5A3D', marginBottom: '0.5rem' }}>⏱️ 출퇴근 체크인</h2>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', marginBottom: '2rem' }}>
        {today} · 현재 {nowStr}시
      </p>

      {/* 처리 결과 메시지 */}
      {message && (
        <div style={{
          marginBottom: '1rem', padding: '1rem', borderRadius: '0.75rem',
          background: message.includes('✅') ? '#E8F5E9' : '#FFF9C4',
          textAlign: 'center', fontWeight: 600, fontSize: '1.1rem',
          border: `2px solid ${message.includes('✅') ? '#4CAF50' : '#FFC107'}`,
        }}>
          {message}
          {done && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
              {todayRecords[targetCg?.id || cgId || '']?.clockOut
                ? '오늘 근무가 완료되었습니다. 수고하셨습니다! 💪'
                : '안전하게 근무하세요! 😊'}
            </div>
          )}
        </div>
      )}

      {/* 자동 처리 중 표시 */}
      {checking && targetCg && !done && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#888' }}>{targetCg.name}님 자동 처리 중...</p>
        </div>
      )}

      {/* 단일 간병인 모드 (링크 접속) — 자동 처리 후 결과만 표시 */}
      {targetCg && done && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            padding: '2rem', background: 'white', borderRadius: '1rem',
            border: '2px solid #2D5A3D', marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {todayRecords[targetCg.id] && !todayRecords[targetCg.id].clockOut ? '🟢' : '✅'}
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{targetCg.name}</h3>
            <p style={{ color: '#888', marginBottom: '0' }}>
              {getStatus(targetCg.id).text}
            </p>
          </div>
          <a href="/checkin" style={{ color: '#888', fontSize: '0.85rem' }}>← 전체 간병인 보기</a>
        </div>
      )}

      {/* 단일 모드 — 버튼 표시 (아직 자동처리 안 됐거나, ?cg 없이 수동) */}
      {targetCg && !done && !checking && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            padding: '2rem', background: 'white', borderRadius: '1rem',
            border: '2px solid #2D5A3D', marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {todayRecords[targetCg.id] && !todayRecords[targetCg.id].clockOut ? '🟢' : '⚪'}
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{targetCg.name}</h3>
            <p style={{ color: '#888', marginBottom: '1.5rem' }}>
              {getStatus(targetCg.id).text}
            </p>
            <button
              onClick={() => handleCheckin(targetCg)}
              style={{
                padding: '1.2rem 3rem', borderRadius: '1rem', border: 'none',
                fontSize: '1.3rem', fontWeight: 800, cursor: 'pointer',
                background: todayRecords[targetCg.id] && !todayRecords[targetCg.id].clockOut
                  ? '#C62828' : '#2D5A3D',
                color: 'white',
              }}
            >
              {todayRecords[targetCg.id] && !todayRecords[targetCg.id].clockOut
                ? `🏠 퇴근하기 (${nowStr}시)` : `🚶 출근하기 (${nowStr}시)`}
            </button>
          </div>
          <a href="/checkin" style={{ color: '#888', fontSize: '0.85rem' }}>← 전체 간병인 보기</a>
        </div>
      )}

      {/* 전체 리스트 모드 */}
      {!targetCg && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {caregivers.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999' }}>등록된 간병인이 없습니다</p>
          )}
          {caregivers.map(cg => {
            const st = getStatus(cg.id);
            const isCheckedIn = todayRecords[cg.id] && !todayRecords[cg.id].clockOut;
            return (
              <div key={cg.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '0.75rem',
                background: st.bg, border: `1px solid ${isCheckedIn ? '#2D5A3D' : '#E0E0E0'}`,
              }}>
                <div style={{ fontSize: '1.5rem' }}>{isCheckedIn ? '🟢' : '⚪'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cg.name}</div>
                  <div style={{ fontSize: '0.8rem', color: st.color }}>{st.text}</div>
                </div>
                <button
                  onClick={() => handleCheckin(cg)}
                  disabled={!!checking || !!(todayRecords[cg.id]?.clockOut)}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: '2rem', border: 'none',
                    fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    background: isCheckedIn ? '#C62828' : '#2D5A3D',
                    color: '#fff',
                    opacity: (checking || todayRecords[cg.id]?.clockOut) ? 0.5 : 1,
                  }}
                >
                  {checking === cg.id ? '...' :
                    todayRecords[cg.id]?.clockOut ? '완료' :
                    isCheckedIn ? `퇴근 (${nowStr}시)` : `출근 (${nowStr}시)`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 링크 모음 */}
      {!targetCg && caregivers.length > 0 && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #E0E0E0' }}>
          <h3 style={{ textAlign: 'center', color: '#555', marginBottom: '0.5rem', fontSize: '1rem' }}>
            📱 간병인별 자동 체크인 링크
          </h3>
          <p style={{ textAlign: 'center', color: '#888', fontSize: '0.75rem', marginBottom: '1rem' }}>
            링크를 카톡으로 보내면 간병인이 클릭만 해도 자동 출퇴근 처리됩니다!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {caregivers.map(cg => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/checkin?cg=${cg.id}` : `/checkin?cg=${cg.id}`;
              return (
                <div key={cg.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.5rem 0.75rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #E0E0E0',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', minWidth: '60px' }}>{cg.name}</span>
                  <span style={{ flex: 1, fontSize: '0.75rem', background: '#F5F5F5', padding: '0.3rem 0.5rem', borderRadius: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{url}</span>
                  <button onClick={() => { navigator.clipboard.writeText(url); alert('복사됨!'); }} style={{ padding: '0.25rem 0.5rem', background: '#2D5A3D', color: '#fff', border: 'none', borderRadius: '0.25rem', fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>📋</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`@media print {
        a, p:first-of-type, h2 + p, button { display: none !important; }
        h3 { font-size: 14px !important; }
      }`}</style>
    </div>
  );
}
