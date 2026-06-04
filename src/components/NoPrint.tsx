'use client';

import { useState, useEffect } from 'react';

export default function NoPrint({ children }: { children: React.ReactNode }) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('print');
    setPrinting(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrinting(e.matches);
    mq.addEventListener('change', handler);

    const beforePrint = () => setPrinting(true);
    const afterPrint = () => setPrinting(false);
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);

    return () => {
      mq.removeEventListener('change', handler);
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  if (printing) return null;
  return <>{children}</>;
}
