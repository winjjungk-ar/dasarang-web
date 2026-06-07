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
  // Insert auto-print script into the HTML
  const autoPrintHtml = html.replace(
    '</body>',
    '<script>window.onload=function(){setTimeout(function(){window.print();},600);};<\/script></body>',
  );

  const blob = new Blob([autoPrintHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Strategy 1: window.open (works on Android Chrome with user gesture)
  const w = window.open(url, '_blank');
  if (w && !w.closed) {
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

  // Use setTimeout — more reliable than rAF on mobile
  setTimeout(() => {
    window.print();
  }, 300);

  const cleanup = () => {
    document.getElementById('__print__')?.remove();
    document.getElementById('__print_style__')?.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
}
