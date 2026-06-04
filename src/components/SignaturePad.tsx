'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  onSave: (dataUrl: string) => void;
  saved?: string;
  label?: string;
}

export default function SignaturePad({ onSave, saved, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!saved);

  useEffect(() => { setHasSignature(!!saved); }, [saved]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    setHasSignature(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [drawing, getPos]);

  const stopDraw = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current!;
    onSave(canvas.toDataURL());
  }, [drawing, onSave]);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSave('');
  };

  return (
    <div style={{ display: 'inline-block', textAlign: 'center' }}>
      {label && <p style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '0.25rem' }}>{label}</p>}
      <div style={{
        border: '2px solid #999', borderRadius: '0.5rem', overflow: 'hidden',
        display: 'inline-block', background: 'white', position: 'relative',
      }}>
        {saved && !hasSignature ? (
          <img src={saved} alt="서명" style={{ width: '220px', height: '80px', objectFit: 'contain' }} />
        ) : (
          <canvas
            ref={canvasRef}
            width={220}
            height={80}
            style={{ cursor: 'crosshair', display: 'block', touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        )}
      </div>
      <div className="no-print" style={{ marginTop: '0.25rem' }}>
        <button onClick={clear} style={{
          padding: '2px 10px', fontSize: '0.6875rem', cursor: 'pointer',
          border: '1px solid #CCC', borderRadius: '3px', background: '#f5f5f5',
        }}>
          지우기
        </button>
      </div>
    </div>
  );
}

// Print-only inline version (for use in print sections)
export function SignaturePrint({ dataUrl, label }: { dataUrl?: string; label?: string }) {
  return (
    <div style={{ display: 'inline-block', textAlign: 'center' }}>
      {label && <p style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '0.25rem' }}>{label}</p>}
      {dataUrl ? (
        <img src={dataUrl} alt="서명" style={{ width: '140px', height: '55px', objectFit: 'contain', border: '1px solid #CCC', borderRadius: '4px' }} />
      ) : (
        <div style={{ width: '140px', height: '55px', border: '1px dashed #CCC', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCC', fontSize: '0.75rem' }}>
          (서명)
        </div>
      )}
    </div>
  );
}
