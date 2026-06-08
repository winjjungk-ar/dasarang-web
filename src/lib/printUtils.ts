'use client';

/**
 * Print utility — dual strategy for desktop + mobile compatibility.
 *
 * Desktop: window.open(blobUrl) — popups allowed with user gesture, reliable.
 * Mobile:  full-viewport iframe — no popup blocker, Blob URL loads properly.
 *
 * Strategy selection is automatic: try window.open first, fall back to iframe.
 *
 * @param html - Full HTML document string to print
 */
export function printBlobHtml(html: string) {
  // Inject auto-print script with multi-trigger for reliability
  const autoPrintHtml = html.replace(
    '</body>',
    `<script>
      (function(){
        var __printed = false, __cleanupSignaled = false;
        function __tryPrint() {
          if (__printed) return;
          __printed = true;
          window.print();
          setTimeout(function(){ __signalDone(); }, 1000);
        }
        function __signalDone() {
          if (__cleanupSignaled) return;
          __cleanupSignaled = true;
          try { window.opener?.__printDone && (window.opener.__printDone = true); } catch(e) {}
          try { window.parent?.__printDone && (window.parent.__printDone = true); } catch(e) {}
        }
        // Trigger 1: DOM ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(__tryPrint, 500);
        } else {
          document.addEventListener('DOMContentLoaded', function(){ setTimeout(__tryPrint, 500); });
        }
        // Trigger 2: window.onload
        window.onload = function(){ setTimeout(__tryPrint, 200); };
        // Trigger 3: safety fallback
        setTimeout(__tryPrint, 4000);
        // Signal done on unload too
        window.addEventListener('beforeunload', function(){ __signalDone(); });
      })();
    <\\/script></body>`,
  );

  const blob = new Blob([autoPrintHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // ── Strategy 1: window.open (desktop — popups allowed with user gesture) ──
  const w = window.open(url, '_blank');
  if (w && !w.closed) {
    // Belt-and-suspenders: if inline script fails, parent tries directly
    setTimeout(() => {
      try { if (!w.closed && w.print) w.print(); } catch (_) {}
    }, 3000);

    // Cleanup on print complete or close
    const doCleanup = () => {
      try { if (!w.closed) w.close(); } catch (_) {}
      URL.revokeObjectURL(url);
    };
    w.addEventListener('afterprint', doCleanup, { once: true });
    w.addEventListener('beforeunload', doCleanup, { once: true });
    // Safety: 10min timeout
    setTimeout(() => {
      try { if (!w.closed) w.close(); } catch (_) {}
      URL.revokeObjectURL(url);
    }, 600_000);
    return;
  }

  // ── Strategy 2: iframe (mobile — window.open blocked) ──
  // Don't call URL.revokeObjectURL yet — iframe needs it

  const iframe = document.createElement('iframe');
  iframe.id = '__print_frame__';
  // No sandbox attribute — causes "content blocked" on desktop Chrome
  iframe.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:white;';
  iframe.src = url;

  const cleanup = () => {
    const el = document.getElementById('__print_frame__');
    if (el) el.remove();
    URL.revokeObjectURL(url);
    delete (window as any).__printDone;
  };

  // Poll for __printDone flag (set by iframe after print)
  (window as any).__printDone = false;
  const poll = setInterval(() => {
    if ((window as any).__printDone) {
      clearInterval(poll);
      cleanup();
    }
  }, 1000);

  document.body.appendChild(iframe);

  // Safety: 10min timeout
  setTimeout(() => {
    clearInterval(poll);
    cleanup();
  }, 600_000);
}
