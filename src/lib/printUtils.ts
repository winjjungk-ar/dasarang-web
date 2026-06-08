'use client';

/**
 * Print utility — optimized for Android + desktop dual compatibility.
 *
 * Strategy:
 *   Desktop: window.open(blobUrl) — popups allowed with user gesture, reliable.
 *   Mobile:  full-viewport iframe with visible fallback button.
 *
 * Mobile-first approach: detect touch device, skip window.open entirely.
 *
 * @param html - Full HTML document string to print
 */
export function printBlobHtml(html: string) {
  const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && window.innerWidth < 1024);

  // Inject auto-print script + visible fallback button
  const autoPrintHtml = html.replace(
    '</body>',
    `<style>
      .__print_fallback__ {
        display: none;
        position: fixed; bottom: 20px; left: 50%;
        transform: translateX(-50%);
        padding: 16px 32px;
        background: #4A7C59; color: white;
        border: none; border-radius: 12px;
        font-size: 18px; font-weight: 700;
        cursor: pointer; z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: __pulse__ 2s infinite;
      }
      @keyframes __pulse__ {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    </style>
    <button class="__print_fallback__" id="__print_fallback_btn__"
      onclick="window.print(); this.style.display='none';">
      🖨️ 인쇄 대화상자가 안 뜨면 여기를 눌러주세요
    </button>
    <script>
      (function(){
        var __printed = false, __cleanupSignaled = false;
        function __tryPrint() {
          if (__printed) return;
          __printed = true;
          window.print();
          setTimeout(function(){ __signalDone(); }, 2000);
        }
        function __signalDone() {
          if (__cleanupSignaled) return;
          __cleanupSignaled = true;
          try { window.opener?.__printDone && (window.opener.__printDone = true); } catch(e) {}
          try { window.parent?.__printDone && (window.parent.__printDone = true); } catch(e) {}
        }
        function __showFallback() {
          var btn = document.getElementById('__print_fallback_btn__');
          if (btn) btn.style.display = 'block';
        }
        // Try auto-print after DOM ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(__tryPrint, 600);
          // Show fallback after 3s if print dialog didn't appear
          setTimeout(function(){ if (!__printed) __showFallback(); }, 3000);
        } else {
          document.addEventListener('DOMContentLoaded', function(){
            setTimeout(__tryPrint, 600);
            setTimeout(function(){ if (!__printed) __showFallback(); }, 3000);
          });
        }
        window.onload = function(){ setTimeout(__tryPrint, 300); };
        // Safety fallback
        setTimeout(function(){ if (!__printed) __showFallback(); }, 5000);
        // Signal done on unload
        window.addEventListener('beforeunload', function(){ __signalDone(); });
        window.addEventListener('afterprint', function(){ __signalDone(); });
      })();
    <\\/script></body>`,
  );

  const blob = new Blob([autoPrintHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // ── Desktop: window.open ──
  if (!isMobile) {
    const w = window.open(url, '_blank');
    if (w && !w.closed) {
      // Belt-and-suspenders: fallback print trigger
      setTimeout(() => {
        try { if (!w.closed && w.print) w.print(); } catch (_) {}
      }, 4000);

      const doCleanup = () => {
        try { if (!w.closed) w.close(); } catch (_) {}
        URL.revokeObjectURL(url);
      };
      w.addEventListener('afterprint', doCleanup, { once: true });
      w.addEventListener('beforeunload', doCleanup, { once: true });
      setTimeout(() => {
        try { if (!w.closed) w.close(); } catch (_) {}
        URL.revokeObjectURL(url);
      }, 120_000); // 2 min safety timeout for desktop
      return;
    }
  }

  // ── Mobile (or desktop fallback): iframe ──
  const iframe = document.createElement('iframe');
  iframe.id = '__print_frame__';
  iframe.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;background:white;';
  iframe.src = url;

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    const el = document.getElementById('__print_frame__');
    if (el) el.remove();
    URL.revokeObjectURL(url);
    delete (window as any).__printDone;
    if (fallbackMsg.parentNode) fallbackMsg.remove();
  };

  // Show a visible message on the parent page so user knows what's happening
  const fallbackMsg = document.createElement('div');
  fallbackMsg.id = '__print_msg__';
  fallbackMsg.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:#FFF3CD;' +
    'color:#856404;text-align:center;font-size:14px;font-weight:600;z-index:999999;' +
    'border-top:2px solid #FFC107;';
  fallbackMsg.textContent = '📄 인쇄 대화상자를 여는 중... 화면에 인쇄 버튼이 보이면 눌러주세요';
  document.body.appendChild(fallbackMsg);

  // Poll for __printDone flag (set by iframe after print)
  (window as any).__printDone = false;
  let pollCount = 0;
  const poll = setInterval(() => {
    pollCount++;
    if ((window as any).__printDone) {
      clearInterval(poll);
      cleanup();
      return;
    }
    // Update message after 5s
    if (pollCount === 5) {
      fallbackMsg.textContent = '🖨️ 인쇄 대화상자가 안 보이면 문서 내 "인쇄" 버튼을 눌러주세요';
      fallbackMsg.style.background = '#E3F2FD';
      fallbackMsg.style.color = '#0D47A1';
      fallbackMsg.style.borderTop = '2px solid #2196F3';
    }
  }, 1000);

  document.body.appendChild(iframe);

  // 60-second timeout — much shorter than before (was 10min)
  setTimeout(() => {
    clearInterval(poll);
    if (!cleaned) {
      fallbackMsg.textContent = '⏰ 인쇄 시간이 초과되었습니다. 페이지를 새로고침 후 다시 시도해주세요';
      fallbackMsg.style.background = '#FFEBEE';
      fallbackMsg.style.color = '#C62828';
      fallbackMsg.style.borderTop = '2px solid #C62828';
      // Don't auto-remove — let user read the message
      setTimeout(cleanup, 5000);
    }
  }, 60_000);
}
