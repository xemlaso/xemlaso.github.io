// src/js/features/desktop-tools.js
// ── Giao diện desktop: nút ⚙ (menu mở lên trên) + thanh Xem hạn cố định ở đáy màn hình ──
(function () {
    'use strict';
  
    const $ = id => document.getElementById(id);
    const isDesktop = () => document.body.dataset.layout === 'desktop';
  
    // ── Menu tùy chọn ─────────────────────────────────────────────
    function closeMenu() {
      $('settingsMenu')?.classList.remove('open');
      $('btnSettings')?.classList.remove('active');
    }
  
    window.toggleSettingsMenu = function (e) {
      e?.stopPropagation();
      const menu = $('settingsMenu');
      if (!menu) return;
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      $('btnSettings')?.classList.toggle('active', open);
    };
  
    // Bấm ra ngoài hoặc Esc → đóng menu
    document.addEventListener('click', e => {
      if (!e.target.closest('#settingsMenu, #btnSettings')) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  
    window.settingsExportPrompt = function () {
      closeMenu();
      if (typeof exportPrompt === 'function') exportPrompt();
    };
  
    // Giữ menu mở trong lúc tạo ảnh để thấy "Đang tạo ảnh…", xong thì đóng
    window.settingsDownloadImage = async function (item) {
      if (typeof downloadLasoImage !== 'function' || item.disabled) return;
      item.disabled = true;
      try {
        await downloadLasoImage(item.querySelector('.sm-label'));
      } finally {
        item.disabled = false;
        closeMenu();
      }
    };
  
    // ── Thanh Xem hạn (#hanNavBar) luôn ở đáy màn hình, rộng đúng cột lá số ──
    function syncHanBar() {
      const bar = $('hanNavBar');
      const wrap = $('lasoWrap');
      if (!bar) return;
      const wasFixed = bar.classList.contains('han-fixed');
  
      if (!isDesktop()) {
        bar.classList.remove('han-fixed');
        bar.style.left = bar.style.width = '';
        if (wrap) wrap.style.paddingBottom = '';
      } else {
        bar.classList.add('han-fixed');
        const r = ($('colLaso') || document.body).getBoundingClientRect();
        bar.style.left = r.left + 'px';
        bar.style.width = r.width + 'px';
        if (wrap) wrap.style.paddingBottom = bar.offsetHeight + 'px';   // chừa chỗ, không che nội dung cuối
      }
  
      // Đổi giữa nằm trong trang ⇄ cố định đáy → tính lại kích thước lá số
      if (wasFixed !== bar.classList.contains('han-fixed') && typeof scaleGrid === 'function') {
        requestAnimationFrame(() => scaleGrid());
      }
    }
  
    function init() {
            // Không khôi phục vị trí cuộn cũ khi tải lại trang; desktop luôn bắt đầu từ đầu trang
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (isDesktop()) window.scrollTo(0, 0);
    
      syncHanBar();
      window.addEventListener('resize', syncHanBar);
      const col = $('colLaso');
      if (col && 'ResizeObserver' in window) new ResizeObserver(syncHanBar).observe(col);   // ẩn sidebar, kéo separator…
      new MutationObserver(syncHanBar)
        .observe(document.body, { attributes: true, attributeFilter: ['data-layout', 'class'] });
    }
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();