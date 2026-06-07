'use client';

import { useEffect, useRef } from 'react';

interface AdSenseProps {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

/**
 * Google AdSense 광고 컴포넌트
 * 
 * 사용 전 준비:
 * 1. https://www.google.com/adsense 에서 다사랑 사이트 등록
 * 2. 승인 후 발급된 publisher ID를 ADSENSE_CLIENT로 설정
 * 3. 광고 단위(ad unit) 생성 후 slot ID 설정
 * 
 * ※ Google 승인 전에는 빈 공간만 표시됩니다.
 */
const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'; // ← 승인 후 실제 ID로 교체

export default function AdSense({
  slot = '',
  format = 'auto',
  style,
}: AdSenseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 페이지에 이미 adsbygoogle 스크립트가 로드되어 있어야 함
    try {
      if (containerRef.current && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
      }
    } catch {
      // AdSense 스크립트가 로드되지 않은 경우 조용히 넘어감
    }
  }, []);

  // publisher ID가 아직 설정되지 않은 경우 광고 대신 placeholder 표시
  if (ADSENSE_CLIENT.includes('XXXX')) {
    return (
      <div
        style={{
          background: '#F0F7F0',
          border: '2px dashed #8DB580',
          borderRadius: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          color: '#5B8C5A',
          fontSize: '0.8125rem',
          ...style,
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📢</div>
        <strong>광고 영역</strong>
        <p style={{ margin: '0.25rem 0 0', opacity: 0.7 }}>
          Google AdSense 승인 후 광고가 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
