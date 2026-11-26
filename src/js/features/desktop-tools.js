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
  

      // ── Cảnh báo khi tải lại / đóng trang mà còn note hoặc nét vẽ (những thứ này không được lưu) ──
      function unsavedState() {
        const ed = $('noteEditor');
        return {
          // Có module lá số đã lưu: chỉ tính khi form/note có thay đổi chưa lưu
          note: typeof window.CLOUD_isDirty === 'function'
            ? window.CLOUD_isDirty()
            : (!!ed && ed.textContent.replace(/\s+/g, '').length > 0),
          draw: !!document.querySelector('#grid .draw-svg > g > *'),
        };
      }
  const hasUnsaved = () => { const s = unsavedState(); return s.note || s.draw; };

  let skipUnloadWarn = false;      // đã đồng ý trong hộp riêng → không hỏi lần hai
  // Nút tải lại của trình duyệt, đóng tab…: chỉ dùng được hộp hỏi mặc định của trình duyệt
  window.addEventListener('beforeunload', e => {
    if (skipUnloadWarn || !hasUnsaved()) return;
    e.preventDefault();
    e.returnValue = '';
  });

  // Desktop: F5 / Ctrl+R / Cmd+R → hộp hỏi riêng
  document.addEventListener('keydown', e => {
    const isReload = e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r');
    if (!isReload || !isDesktop() || !hasUnsaved()) return;
    e.preventDefault();
    confirmReload();
  }, true);

  function confirmReload() {
    if ($('reloadConfirm')) return;
    const s = unsavedState();
    const what = [s.note && 'thông tin lá số hoặc ghi chú', s.draw && 'nét vẽ trên lá số'].filter(Boolean).join(' và ');
    const ov = document.createElement('div');
    ov.id = 'reloadConfirm';
    ov.className = 'rc-overlay';
    ov.innerHTML = `<div class="rc-box" role="dialog" aria-modal="true" aria-labelledby="rcTitle">
        <div class="rc-title" id="rcTitle">Tải lại trang?</div>
        <div class="rc-text">Bạn đang có ${what} chưa được lưu. Tải lại trang sẽ mất hết.</div>
        <div class="rc-actions">
          <button type="button" class="rc-cancel">Ở lại</button>
          <button type="button" class="rc-ok">Tải lại</button>
        </div>
      </div>`;
    const onKey = ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); } };
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
    ov.addEventListener('click', ev => {
      if (ev.target === ov || ev.target.closest('.rc-cancel')) close();
      else if (ev.target.closest('.rc-ok')) { skipUnloadWarn = true; location.reload(); }
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(ov);
    ov.querySelector('.rc-cancel').focus();      // mặc định chọn "Ở lại" cho an toàn
  }
  
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

  // Desktop: khóa cuộn cả trang, chỉ các vùng riêng (danh sách lá số, note…) tự cuộn.
  // Dùng class + CSS !important để script khác có gán style.overflow cũng không mở khóa được.
  const lockStyle = document.createElement('style');
  lockStyle.textContent = 'html.page-locked, html.page-locked body { overflow: hidden !important; overscroll-behavior: none; }';
  document.head.appendChild(lockStyle);
  function lockPageScroll() {
    document.documentElement.classList.toggle('page-locked', isDesktop());
  }
  
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
      lockPageScroll();
      new MutationObserver(() => { syncHanBar(); lockPageScroll(); })
        .observe(document.body, { attributes: true, attributeFilter: ['data-layout', 'class'] });
    }
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();