// src/js/side-fold.js — Desktop: tạm thu gọn khung Form (formArea) hoặc khung "Lá số đã lưu" (cloudPanel).
// Thu 1 khung thì khung kia chiếm hết chiều cao. Chỉ 1 khung được thu tại một thời điểm. Không nhớ sau F5.
(function () {
    'use strict';
    const ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const isDesktop = () => document.body.dataset.layout === 'desktop';
  
    function setFold(k) {                       // k: 'form' | 'cloud' | null
      document.body.classList.toggle('fold-form', k === 'form');
      document.body.classList.toggle('fold-cloud', k === 'cloud');
      document.querySelectorAll('.side-fold-btn').forEach(b => {
        const thu = document.body.classList.contains('fold-' + b.dataset.fold);
        b.title = thu ? 'Mở rộng' : 'Thu gọn';
        b.setAttribute('aria-expanded', String(!thu));
      });
    }
    function toggle(k) {
      if (!isDesktop()) return;
      setFold(document.body.classList.contains('fold-' + k) ? null : k);
    }
  
    function makeBtn(k) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'side-fold-btn';
      b.dataset.fold = k;
      b.innerHTML = ICON;
      b.addEventListener('click', e => { e.stopPropagation(); toggle(k); });
      return b;
    }
  
    // Gắn nút vào thanh tab của form và tiêu đề "Lá số đã lưu" (2 chỗ này có thể bị vẽ lại → gắn lại)
    function ensure() {
      const tabBar = document.querySelector('#formArea .tab-bar');
      if (tabBar && !tabBar.querySelector('.side-fold-btn')) tabBar.appendChild(makeBtn('form'));
  
      const panel = document.getElementById('cloudPanel');
      const head = panel && (panel.querySelector('.cl-head') || panel.firstElementChild);
      if (head && !head.querySelector('.side-fold-btn')) {
        head.setAttribute('data-fold-head', '');
        head.appendChild(makeBtn('cloud'));
        head.addEventListener('click', e => { if (!e.target.closest('a,input,select,button:not(.side-fold-btn)')) toggle('cloud'); });
      }
      setFold(document.body.classList.contains('fold-form') ? 'form'
        : document.body.classList.contains('fold-cloud') ? 'cloud' : null);
    }
  
    function init() {
      ensure();
      let hen = 0;
      new MutationObserver(() => { cancelAnimationFrame(hen); hen = requestAnimationFrame(ensure); })
        .observe(document.getElementById('colChat') || document.body, { childList: true, subtree: true });
      // Bấm 1 tab (Dương lịch / Âm lịch / …) khi form đang thu → mở form ra
      document.addEventListener('click', e => {
        if (e.target.closest('#formArea .tab-btn') && document.body.classList.contains('fold-form')) setFold(null);
      }, true);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();