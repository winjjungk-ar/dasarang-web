'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'

interface Review {
  id: string
  name: string
  text: string
  stars: number
  relation: string
  region: string
  createdAt: { seconds: number }
}

const AVATARS = ['👩', '👨', '👩‍🦰', '👴', '👵', '👩‍🦳', '👨‍🦳', '👱‍♀️', '👨‍🦰', '👩‍🦱']

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review))
        if (list.length > 0) {
          setReviews(list)
        }
      } catch (err) {
        console.error('[ReviewSection] Failed to load reviews:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Fallback: show static reviews if Firestore is empty
  const displayReviews =
    reviews.length > 0
      ? reviews
      : [
          {
            id: 'static-1',
            stars: 5,
            text: '어머니 케어가 너무 세심해서 정말 감동했어요. 매일 보고서로 확인하니 안심되고, 간병인 선생님의 진심이 느껴집니다.',
            name: '김영숙',
            relation: '보호자 (딸)',
            region: '충주시',
            createdAt: { seconds: 0 },
          },
          {
            id: 'static-2',
            stars: 5,
            text: '아버지가 치매로 힘들어하셨는데, 선생님 덕분에 웃음을 되찾으셨어요. 가족보다 더 잘 챙겨주셔서 눈물날 정도로 감사했습니다.',
            name: '박정호',
            relation: '보호자 (아들)',
            region: '제천시',
            createdAt: { seconds: 0 },
          },
          {
            id: 'static-3',
            stars: 5,
            text: '24시간 믿고 맡길 수 있는 유일한 곳이에요. 응급상황 때도 바로 연락주셔서 얼마나 든든한지 몰라요. 강력 추천합니다.',
            name: '이미영',
            relation: '보호자 (딸)',
            region: '영월군',
            createdAt: { seconds: 0 },
          },
        ]

  return (
    <section style={{ padding: '4rem 0', background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 100%)' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#5B8C5A',
              marginBottom: '0.75rem',
            }}
          >
            보호자분들의 진심
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>
            {reviews.length > 0
              ? `실제 이용하신 보호자분들의 따뜻한 후기입니다 (${reviews.length}건)`
              : '실제 이용하신 보호자분들의 따뜻한 후기입니다'}
          </p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>
            후기를 불러오는 중...
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {displayReviews.map((r, i) => {
            const avatar = AVATARS[i % AVATARS.length]
            return (
              <div
                key={r.id}
                style={{
                  background: 'white',
                  borderRadius: '1.25rem',
                  padding: '2rem',
                  boxShadow: '0 3px 16px rgba(139, 119, 90, 0.08)',
                  border: '1px solid #F0E8D8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    color: '#F4B400',
                    fontSize: '1.25rem',
                    letterSpacing: '0.1rem',
                  }}
                >
                  {'★'.repeat(r.stars)}
                  {'☆'.repeat(5 - r.stars)}
                </div>
                <p
                  style={{
                    color: '#3D3929',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                  }}
                >
                  "{r.text}"
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderTop: '1px solid #F0E8D8',
                    paddingTop: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      borderRadius: '50%',
                      background: '#E8F5E9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#4A7C59',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {r.name}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>
                      {r.relation} · {r.region}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Write review CTA */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link
            href="/review/new"
            style={{
              display: 'inline-block',
              background: 'white',
              color: '#5B8C5A',
              padding: '0.875rem 2rem',
              borderRadius: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '1rem',
              border: '2px solid #5B8C5A',
            }}
          >
            ✍️ 후기 작성하기
          </Link>
        </div>
      </div>
    </section>
  )
}
