'use client';

/**
 * Print utility — Blob URL + window.open with DOM fallback.
 *
 * Strategy:
 *   1. window.open(blobUrl) — works on Android Chrome (user-gesture popups allowed)
 *   2. If popup blocked → replace current page DOM + window.print()
 *
 * @param html - Full HTML document string to print
 */
export function printBlobHtml(html: string) {
  // 🔴 CRITICAL: Android Chrome Blob URL에서는 window.onload가 불발하는 경우가 빈번함.
  // → 다중 트리거(onload + DOMContentLoaded + setTimeout 백업) + 부모창에서 setTimeout print() 병행
  const autoPrintHtml = html.replace(
    '</body>',
    `<script>
      var __printed = false;
      function __tryPrint() {
        if (__printed) return;
        __printed = true;
        setTimeout(function(){ window.print(); }, 400);
      }
      // Trigger 1: onload (works in desktop, unreliable on Android Blob)
      window.onload = function(){ setTimeout(__tryPrint, 200); };
      // Trigger 2: DOMContentLoaded (fires earlier, more reliable on mobile)
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(__tryPrint, 400);
      } else {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(__tryPrint, 400); });
      }
      // Trigger 3: absolute fallback — fire anyway after 2s
      setTimeout(__tryPrint, 2000);
    <\\/script></body>`,
  );

  const blob = new Blob([autoPrintHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Strategy 1: window.open (works on Android Chrome with user gesture)
  const w = window.open(url, '_blank');
  if (w && !w.closed) {
    // Belt-and-suspenders: also try printing from parent after delay
    // (catches cases where Blob page's onload/DOMContentLoaded both fail)
    setTimeout(() => {
      try {
        if (!w.closed && w.print) w.print();
      } catch (_) { /* Blob page will handle it via its own triggers */ }
    }, 2500);

    // Cleanup after print
    w.addEventListener('afterprint', () => {
      w.close();
      URL.revokeObjectURL(url);
    }, { once: true });
    // Safety close after 5min
    setTimeout(() => {
      if (!w.closed) w.close();
      URL.revokeObjectURL(url);
    }, 300_000);
    return;
  }

  // Strategy 2: Popup blocked — inline DOM + window.print()
  URL.revokeObjectURL(url);

  const existing = document.getElementById('__print__');
  if (existing) existing.remove();

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const styleMatch = html.match(/<style[^>]*>([\s\S]*)<\/style>/i);
  const content = bodyMatch ? bodyMatch[1] : html;
  const styles = styleMatch ? styleMatch[1] : '';

  const div = document.createElement('div');
  div.id = '__print__';
  div.innerHTML = content;

  const styleEl = document.createElement('style');
  styleEl.id = '__print_style__';
  styleEl.textContent = styles + `
    @media screen { #__print__ { display: none; } }
    @media print {
      html, body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body > *:not(#__print__) { display: none !important; }
      #__print__ { display: block !important; position: static !important; visibility: visible !important; }
    }
  `;

  document.head.appendChild(styleEl);
  document.body.insertBefore(div, document.body.firstChild);

  setTimeout(() => {
    window.print();
  }, 500);

  const cleanup = () => {
    document.getElementById('__print__')?.remove();
    document.getElementById('__print_style__')?.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
}
