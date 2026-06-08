'use client';

/**
 * Print utility — iframe-first approach for Android Chrome compatibility.
 *
 * window.open(blobUrl) fails on Android Chrome because:
 *   1. Popup blocker may intercept it
 *   2. Blob URLs in new windows don't reliably fire onload
 *   3. Cross-window Blob references can fail
 *
 * Solution: full-viewport iframe with Blob URL src.
 *   - No popup blocker (iframe, not window.open)
 *   - Proper document context → @page CSS works
 *   - auto-print script fires reliably inside the iframe
 *   - iframe signals parent via __printDone flag for cleanup
 *
 * @param html - Full HTML document string to print
 */
export function printBlobHtml(html: string) {
  // Inject auto-print script that fires reliably in iframe context.
  // After printing, sets window.parent.__printDone to trigger parent cleanup.
  const autoPrintHtml = html.replace(
    '</body>',
    `<script>
      (function(){
        var __printed = false;
        function __tryPrint() {
          if (__printed) return;
          __printed = true;
          window.print();
          // Signal parent to clean up after print dialog closes
          setTimeout(function(){
            try { window.parent.__printDone = true; } catch(e) {}
          }, 1500);
        }
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(__tryPrint, 500);
        } else {
          document.addEventListener('DOMContentLoaded', function(){
            setTimeout(__tryPrint, 500);
          });
        }
        setTimeout(__tryPrint, 4000);
      })();
    <\\/script></body>`,
  );

  const blob = new Blob([autoPrintHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Full-viewport iframe — no popup blocker, proper @page support
  const iframe = document.createElement('iframe');
  iframe.id = '__print_frame__';
  iframe.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:white;';
  iframe.src = url;

  const cleanup = () => {
    const el = document.getElementById('__print_frame__');
    if (el) el.remove();
    URL.revokeObjectURL(url);
    delete (window as any).__printDone;
  };

  // Start polling for __printDone flag (set by iframe after print)
  (window as any).__printDone = false;
  const poll = setInterval(() => {
    if ((window as any).__printDone) {
      clearInterval(poll);
      cleanup();
    }
  }, 1000);

  document.body.appendChild(iframe);

  // Safety: cleanup after 10min regardless
  setTimeout(() => {
    clearInterval(poll);
    cleanup();
  }, 600_000);
}
