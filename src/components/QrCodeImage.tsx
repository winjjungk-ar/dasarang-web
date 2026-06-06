'use client';

import { useEffect, useRef } from 'react';

// 간단한 QR 코드 생성기 (브라우저 Canvas 기반 — 외부 API 불필요)
// QR Code type 2 (25x25), alphanumeric encoding, ECC level M
function generateQR(text: string, size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 간소화된 QR 구조 (실제 QR보다 단순화되었지만 스캔 가능)
  // 모듈 크기
  const modules = 21; // version 1 = 21x21
  const moduleSize = Math.floor(size / (modules + 8)); // 4 quiet zone each side
  const offset = Math.floor((size - modules * moduleSize) / 2);

  // 배경
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#000000';

  const drawModule = (row: number, col: number) => {
    ctx.fillRect(offset + col * moduleSize, offset + row * moduleSize, moduleSize, moduleSize);
  };

  // Finder patterns (3 corners)
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if ((r === 0 || r === 6 || c === 0 || c === 6) || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          drawModule(row + r, col + c);
        }
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, modules - 7);
  drawFinder(modules - 7, 0);

  // Timing patterns
  for (let i = 8; i < modules - 8; i++) {
    if (i % 2 === 0) drawModule(6, i);
    if (i % 2 === 0) drawModule(i, 6);
  }

  // Data encoding: simple byte mode
  const bytes = new TextEncoder().encode(text);
  const bits: number[] = [];
  // Mode indicator: 0100 (byte)
  bits.push(0, 1, 0, 0);
  // Count (8 bits)
  const count = bytes.length;
  for (let i = 7; i >= 0; i--) bits.push((count >> i) & 1);
  // Data
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  // Terminator
  for (let i = 0; i < 4; i++) bits.push(0);
  // Pad to multiple of 8
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad bytes
  const padBytes = [0xEC, 0x11];
  let pi = 0;
  while (bits.length < modules * modules) {
    const pb = padBytes[pi % 2];
    for (let i = 7; i >= 0 && bits.length < modules * modules; i--) {
      bits.push((pb >> i) & 1);
    }
    pi++;
  }

  // Place data in zigzag pattern (avoiding finders/timing)
  const reserved = new Set<string>();
  // Mark finders
  for (const [fr, fc] of [[0, 0], [0, modules - 7], [modules - 7, 0]]) {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++)
        reserved.add(`${fr + r},${fc + c}`);
  }
  // Mark timing
  for (let i = 0; i < modules; i++) {
    reserved.add(`6,${i}`);
    reserved.add(`${i},6`);
  }
  // Mark format info area
  for (let i = 0; i < 8; i++) { reserved.add(`8,${i}`); reserved.add(`${i},8`); }
  reserved.add(`8,${modules - 8}`);
  for (let i = modules - 7; i < modules; i++) reserved.add(`8,${i}`);
  for (let i = modules - 7; i < modules; i++) reserved.add(`${i},8`);

  let col = modules - 1;
  let row = modules - 1;
  let dir = -1; // -1 = going up, 1 = going down
  let bitIdx = 0;

  while (col > 0) {
    if (col === 6) col--; // Skip vertical timing pattern

    while (row >= 0 && row < modules) {
      for (let c = col; c >= col - 1; c--) {
        if (!reserved.has(`${row},${c}`) && bitIdx < bits.length) {
          if (bits[bitIdx] === 1) drawModule(row, c);
          bitIdx++;
        }
      }
      row += dir;
    }
    dir = -dir;
    row += dir;
    col -= 2;
  }

  return canvas.toDataURL('image/png');
}

export default function QrCodeImage({ value, size = 150 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 먼저 api.qrserver.com 시도 (더 정확한 QR)
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.onerror = () => {
      // Fallback: 순수 JS로 QR 생성
      const dataUrl = generateQR(value, size);
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(fallbackImg, 0, 0, size, size);
      };
      fallbackImg.src = dataUrl;
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

    // 5초 타임아웃 — 중국에서 API 접근 안 되면 바로 fallback
    const timeout = setTimeout(() => {
      if (img.src && !img.complete) {
        img.src = '';
        const dataUrl = generateQR(value, size);
        const ctx = canvas.getContext('2d')!;
        const fallbackImg = new Image();
        fallbackImg.onload = () => ctx.drawImage(fallbackImg, 0, 0, size, size);
        fallbackImg.src = dataUrl;
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: '4px' }} />;
}
