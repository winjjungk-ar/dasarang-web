'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db, ensureAuth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const RELATIONS = [
  '보호자 (딸)',
  '보호자 (아들)',
  '배우자',
  '보호자 (며느리)',
  '보호자 (사위)',
  '기타 가족',
]
const REGIONS = ['제천시', '충주시', '영월군', '기타']

export default function ReviewNewPage() {
  const router = useRouter()
  const [stars, setStars] = useState(0)
  const [hoverStars, setHoverStars] = useState(0)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [region, setRegion] = useState('')
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const displayStars = hoverStars || stars

  const handleSubmit = async () => {
    setError('')

    if (stars === 0) {
      setError('별점을 선택해주세요')
      return
    }
    if (!name.trim()) {
      setError('이름을 입력해주세요')
      return
    }
    if (!relation) {
      setError('관계를 선택해주세요')
      return
    }
    if (!region) {
      setError('지역을 선택해주세요')
      return
    }
    if (!text.trim()) {
      setError('후기 내용을 입력해주세요')
      return
    }
    if (text.trim().length < 10) {
      setError('후기는 10자 이상 작성해주세요')
      return
    }
    if (!password || password.length < 4) {
      setError('비밀번호는 4자리 이상 입력해주세요')
      return
    }

    setSubmitting(true)

    try {
      await ensureAuth()
      const hashedPw = await hashSimple(password)

      await addDoc(collection(db, 'reviews'), {
        name: name.trim(),
        text: text.trim(),
        stars,
        relation,
        region,
        password: hashedPw,
        approved: true,
        createdAt: serverTimestamp(),
      })

      setDone(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (err: any) {
      console.error('[Review] Submit failed:', err)
      setError('후기 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 100%)',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💚</div>
        <h2 style={{ fontSize: '1.5rem', color: '#5B8C5A', marginBottom: '0.5rem' }}>
          소중한 후기 감사합니다!
        </h2>
        <p style={{ color: '#6B7280' }}>홈페이지로 이동합니다...</p>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 50%, #F5F0E8 100%)',
        padding: '4rem 1rem',
      }}
    >
      <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✍️</div>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 'bold',
              color: '#5B8C5A',
              marginBottom: '0.5rem',
            }}
          >
            후기 작성
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.9375rem' }}>
            다사랑 간병 서비스를 이용하신 소중한 경험을 들려주세요
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            background: 'white',
            borderRadius: '1.25rem',
            padding: '2rem',
            boxShadow: '0 3px 16px rgba(139, 119, 90, 0.08)',
            border: '1px solid #F0E8D8',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Stars */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#3D3929',
                marginBottom: '0.5rem',
              }}
            >
              별점
            </label>
            <div style={{ display: 'flex', gap: '0.25rem', fontSize: '2rem' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStars(s)}
                  onMouseEnter={() => setHoverStars(s)}
                  onMouseLeave={() => setHoverStars(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.125rem',
                    color: s <= displayStars ? '#F4B400' : '#D1D5DB',
                    transition: 'color 0.15s',
                    fontSize: 'inherit',
                    lineHeight: 1,
                  }}
                >
                  ★
                </button>
              ))}
              {stars > 0 && (
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: '#9CA3AF',
                    alignSelf: 'center',
                    marginLeft: '0.5rem',
                  }}
                >
                  {stars}점
                </span>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="review-name"
              style={{
                display: 'block',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#3D3929',
                marginBottom: '0.5rem',
              }}
            >
              이름
            </label>
            <input
              id="review-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              maxLength={20}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1.5px solid #E8D5C4',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Relation + Region */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#3D3929',
                  marginBottom: '0.5rem',
                }}
              >
                관계
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1.5px solid #E8D5C4',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">선택</option>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#3D3929',
                  marginBottom: '0.5rem',
                }}
              >
                지역
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1.5px solid #E8D5C4',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">선택</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text */}
          <div>
            <label
              htmlFor="review-text"
              style={{
                display: 'block',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#3D3929',
                marginBottom: '0.5rem',
              }}
            >
              후기 내용
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="간병 서비스를 이용하신 경험을 자유롭게 들려주세요. 다른 보호자분들께 큰 도움이 됩니다. (10자 이상)"
              rows={5}
              maxLength={500}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1.5px solid #E8D5C4',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.7,
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                textAlign: 'right',
                fontSize: '0.8125rem',
                color: '#9CA3AF',
                marginTop: '0.25rem',
              }}
            >
              {text.length}/500자
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="review-pw"
              style={{
                display: 'block',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#3D3929',
                marginBottom: '0.5rem',
              }}
            >
              비밀번호
            </label>
            <input
              id="review-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="후기 삭제 시 필요합니다 (4자리 이상)"
              minLength={4}
              maxLength={20}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1.5px solid #E8D5C4',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: '#FFF3F3',
                color: '#C62828',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '1rem',
              background: submitting ? '#9BC4A0' : '#5B8C5A',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '등록 중...' : '💚 후기 등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Simple hash for review passwords — not cryptographic, just obscures from Firestore console */
async function hashSimple(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode('review-salt:' + input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
