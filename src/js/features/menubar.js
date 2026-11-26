// src/js/features/menubar.js
// ── Desktop: thanh menu trên cùng ───────────────────────────────
//   [⇤] Vận mệnh │ Xem lá số · Tìm lá số · ⚙ Cấu hình │ ............ │ 👤 email ▾ / Đăng nhập ▾
//   • Xem lá số : sidebar = Dương lịch/Âm lịch + form + Lá số đã lưu; phải = lá số, Note, ✎ ⚙
//   • Tìm lá số : sidebar = điều kiện + kết quả;  phải = lá số kết quả
//   • Cấu hình  : sidebar = bảng cấu hình;        phải = lá số của tab Xem lá số
//   • Tab Xem lá số và Tìm lá số nhớ lá số riêng (giống bản mobile).
//   • Mobile không dùng thanh này (mobile-cloud.js lo phần mobile).
(function () {
    'use strict';
  
    const $ = id => document.getElementById(id);
    const isDesktop = () => document.body.dataset.layout === 'desktop';
    const hasFn = n => typeof window[n] === 'function';
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  
    // Tab Tìm lá số là trang riêng → lập lá số ở tab Xem lá số không xóa kết quả tìm
    const prevPin = window.SEARCH_PIN_RESULTS;
    window.SEARCH_PIN_RESULTS = () => isDesktop() || !!(prevPin && prevPin());
  
    // ── Giữ kết quả tìm khi ở trang khác ──────────────────────────
    //   (1) clearSearchResultsState() gọi từ lapLaSo… ngoài tab Tìm → bỏ qua.
    //   (2) Sao lưu kết quả; nếu vẫn bị xóa (vd. hàm bắt sự kiện sửa form bên trong search-laso.js)
    //       thì khi mở lại tab Tìm sẽ khôi phục.
    let backup = null;                    // { results, idx, status }
    function captureResults() {
      const r = window._searchResults;
      if (Array.isArray(r) && r.length) {
        backup = { results: r, idx: (typeof window._currentSearchResultIdx === 'number' ? window._currentSearchResultIdx : 0),
                   status: $('searchStatus')?.textContent || '' };
      }
    }
    function restoreResultsIfLost() {
      if (window._searchResults?.length || !backup?.results?.length) return false;
      window._searchResults = backup.results;
      const idx = Math.max(0, Math.min(backup.idx, backup.results.length - 1));
      if (hasFn('openSearchResult')) window.openSearchResult(idx);   // vẽ lại danh sách, ◀ ▶ và lá số
      const st = $('searchStatus'); if (st && backup.status) st.textContent = backup.status;
      return true;
    }
    window.SEARCH_RESTORE_IF_LOST = restoreResultsIfLost;           // mobile-cloud.js dùng chung
    function guardSearchApi() {
      const clear = window.clearSearchResultsState;
      if (typeof clear === 'function' && !clear._guarded) {
        const g = function () {
          if (window.SEARCH_PIN_RESULTS?.() && (window._currentTab || '') !== 'SEARCH') return;   // tab Tìm giữ kết quả riêng
          return clear.apply(this, arguments);
        };
        g._guarded = true;
        window.clearSearchResultsState = g;
      }
      const run = window.searchLaSo;
      if (typeof run === 'function' && !run._wrapped) {
        const w = async function () {
          const before = window._searchResults;
          try { return await run.apply(this, arguments); }
          finally {
            // Tìm mới (kể cả ra 0 kết quả) → sao lưu theo kết quả mới
            if (window._searchResults !== before) backup = null;
            captureResults();
          }
        };
        w._wrapped = true;
        window.searchLaSo = w;
      }
    }
  
    let bar, page = 'laso';               // 'laso' | 'search' | 'cfg'
    const scrollMem = {};                 // vị trí cuộn thanh bên của từng trang
    let formSnap = null;                  // form của tab Xem lá số khi đang ở tab Tìm
    let formTab = 'DL';                   // tab Dương/Âm lịch của trang Xem lá số
  
    // ── Dựng thanh ──────────────────────────────────────────────
    function build() {
      bar = document.createElement('div');
      bar.id = 'menuBar';
      bar.className = 'menubar';
      bar.innerHTML = `
        <div class="mb-left">
          <span class="mb-slot-sidebar"></span>
          <span class="mb-brand">Vận mệnh</span>
        </div>
        <nav class="mb-tabs" role="tablist">
          <button type="button" class="mb-tab" data-page="laso">Xem lá số</button>
          <button type="button" class="mb-tab" data-page="search">Tìm lá số</button>
          <button type="button" class="mb-tab" data-page="cfg">⚙ Cấu hình</button>
        </nav>
        <div class="mb-right">
          <div class="mb-acc" id="mbAccount"></div>
        </div>`;
      document.body.insertBefore(bar, document.body.firstChild);
  
      // Nút ⇤ ẩn/hiện thanh bên: chuyển hẳn lên menubar (toggleSidebar vẫn đổi chữ ⇤/⇥ như cũ)
      const sb = $('btnToggleSidebar');
      if (sb) bar.querySelector('.mb-slot-sidebar').appendChild(sb);
  
      bar.addEventListener('click', e => {
        const t = e.target.closest('[data-page]');
        if (t) { goPage(t.dataset.page); return; }
        const a = e.target.closest('[data-acc]');
        if (a) onAccount(a.dataset.acc, e);
      });
      document.addEventListener('click', e => { if (!e.target.closest('#mbAccount')) closeAccMenu(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAccMenu(); });
    }
  
    // ── Trang ───────────────────────────────────────────────────
    const FORM_IDS = ['hoTen', 'ngay', 'thang', 'nam', 'ngayDL', 'thangDL', 'namDL', 'gio', 'gt'];
    const tabNow = () => window._currentTab || 'DL';
    function hasLaso() {
      const w = $('lysoApiWrap');
      return !!$('grid')?.children.length || !!(w && w.style.display !== 'none' && $('lysoApiImage')?.getAttribute('src'));
    }
    function readForm() {
      const v = {};
      FORM_IDS.forEach(id => { const el = $(id); if (el) v[id] = el.value; });
      return v;
    }
    function setFormRaw(v) { FORM_IDS.forEach(id => { const el = $(id); if (el && id in v) el.value = v[id]; }); }
    function restoreForm(s) {
      if (!s) return;
      setFormRaw(s.v);
      if (typeof syncMobilePickersFromInputs === 'function') syncMobilePickersFromInputs();
      if (typeof syncGioToGioXem === 'function') syncGioToGioXem();
    }
    const searchIdx = () => (typeof window._currentSearchResultIdx === 'number' ? window._currentSearchResultIdx : -1);
  
    function enterSearch() {
      formSnap = { v: readForm(), hadLaso: hasLaso() };
      if (tabNow() !== 'SEARCH' && typeof switchTab === 'function') switchTab('SEARCH');
      if (restoreResultsIfLost()) return;                                       // kết quả lỡ bị xóa → lấy lại
      const idx = searchIdx();
      if (idx >= 0 && hasFn('openSearchResult')) window.openSearchResult(idx);   // vẽ lại lá số kết quả đang xem
    }
    // Rời tab Tìm: điền lại form của tab Xem lá số và vẽ lại lá số đó
    function leaveSearch(toTab) {
      captureResults();
      const s = formSnap;
      formSnap = null;
      restoreForm(s);
      if (typeof switchTab === 'function') switchTab(toTab);
      if (s && s.hadLaso) {
        if (typeof lapLaSo === 'function') lapLaSo();
      } else {
        const g = $('grid'); if (g) g.innerHTML = '';
        if (typeof toggleLysoApiMode === 'function') { try { toggleLysoApiMode(false); } catch (e) {} }
        const w = $('lasoWrap'); if (w) w.style.display = 'none';
      }
    }
  
    function goPage(p) {
      if (!isDesktop() || p === page) return;
      if (p === 'cfg' && typeof isLysoTemplateActive === 'function' && isLysoTemplateActive()) {
        toast('Cấu hình không dùng được với phương pháp lyso.vn (lá số dạng ảnh).');
        return;
      }
      // Rời tab Xem lá số: tạm dừng bút vẽ, giữ nét (quay lại thì vẽ lại đúng chỗ)
      if (page === 'laso' && hasFn('DRAW_suspend')) window.DRAW_suspend();
      const t = tabNow();
      if (t === 'DL' || t === 'AL') formTab = t;
      const fa = $('formArea');
      if (fa) scrollMem[page] = fa.scrollTop;
  
      if (p === 'search') {
        enterSearch();
      } else if (page === 'search') {
        leaveSearch(p === 'cfg' ? 'CFG' : formTab);
      } else if (typeof switchTab === 'function') {
        switchTab(p === 'cfg' ? 'CFG' : formTab);
      }
      page = p;
      syncUi();
      if (p === 'laso' && hasFn('DRAW_resume')) window.DRAW_resume();
      if (fa) requestAnimationFrame(() => { fa.scrollTop = scrollMem[p] || 0; });
      if (typeof rerenderLaso === 'function') setTimeout(rerenderLaso, 0);       // Note ẩn/hiện → đổi bề rộng lá số
    }
  
    // Trạng thái trang suy ra từ tab đang mở (khi tab bị đổi từ chỗ khác: mở lá số đã lưu, chuyển layout…)
    function syncFromTab() {
      if (!isDesktop()) return;
      const t = tabNow();
      const want = t === 'SEARCH' ? 'search' : t === 'CFG' ? 'cfg' : 'laso';
      if (want !== page) {
        if (page === 'search' && want !== 'search') formSnap = null;   // form đã được nơi khác điền mới
        page = want;
        syncUi();
      }
    }
  
    // Hàng ◀ ▶ ☰ ★: đặt ngay trên lá số (cũ: dưới lá số, bị thanh Xem hạn cố định ở đáy che mất)
    function placeNav() {
      const nav = $('searchResultNav'), wrap = $('lasoWrap');
      if (!isDesktop() || !nav || !wrap) return;
      if (wrap.firstElementChild !== nav) wrap.insertBefore(nav, wrap.firstElementChild);
    }
  
    function syncUi() {
      const d = isDesktop();
      placeNav();
      ['laso', 'search', 'cfg'].forEach(k => document.body.classList.toggle('mb-page-' + k, d && page === k));
      document.body.classList.toggle('mb-search-empty', d && page === 'search' && searchIdx() < 0);
      bar?.querySelectorAll('[data-page]').forEach(b => {
        const on = b.dataset.page === page;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
  
    // Cảnh báo "chưa lưu" khi đang ở tab Tìm: so form của tab Xem lá số, không so form đang chứa kết quả tìm
    function wrapDirtyCheck() {
      const orig = window.CLOUD_isDirty;
      if (typeof orig !== 'function' || orig._desktopWrapped) return;
      const wrapped = function () {
        if (!(isDesktop() && page === 'search' && formSnap)) return orig();
        const cur = readForm();
        setFormRaw(formSnap.v);
        try { return orig(); } finally { setFormRaw(cur); }
      };
      wrapped._desktopWrapped = true;
      window.CLOUD_isDirty = wrapped;
    }
  
    // ── Tài khoản ───────────────────────────────────────────────
    let user = null;
    function renderAccount() {
      const box = $('mbAccount');
      if (!box) return;
      if (!user) {
        box.innerHTML = `
          <button type="button" class="mb-acc-btn mb-login" data-acc="toggle">Đăng nhập ▾</button>
          <div class="mb-acc-menu" role="menu">
            <button type="button" data-acc="google">Đăng nhập bằng Google</button>
            <button type="button" data-acc="email">Đăng nhập bằng email</button>
          </div>`;
        return;
      }
      const name = user.email || user.displayName || 'Tài khoản';
      const warn = !user.emailVerified;
      box.innerHTML = `
        <button type="button" class="mb-acc-btn" data-acc="toggle" title="${esc(name)}">
          <span class="mb-avatar">${esc(name.charAt(0).toUpperCase())}</span>
          <span class="mb-email">${esc(name)}</span>${warn ? '<span class="mb-warn" title="Email chưa xác minh">⚠</span>' : ''} ▾
        </button>
        <div class="mb-acc-menu" role="menu">
          <div class="mb-acc-info">${esc(name)}</div>
          ${warn ? `
          <div class="mb-acc-note">Email chưa xác minh nên chưa lưu được lá số. Mở hộp thư, bấm link xác minh.</div>
          <button type="button" data-acc="reload">Tôi đã xác minh</button>
          <button type="button" data-acc="resend">Gửi lại thư xác minh</button>
          <div class="mb-acc-sep"></div>` : ''}
          <button type="button" data-acc="logout">Đăng xuất</button>
        </div>`;
    }
    function closeAccMenu() { $('mbAccount')?.classList.remove('open'); }
    function onAccount(act, e) {
      if (act === 'toggle') { e.stopPropagation(); $('mbAccount').classList.toggle('open'); return; }
      closeAccMenu();
      if (!hasFn('CLOUD_authAct')) return;
      // Đang ở trang Tìm: form đang chứa kết quả tìm → trả form về như ở trang Xem lá số
      // trong lúc hỏi "có thay đổi chưa lưu" khi đăng xuất
      if (act === 'logout' && page === 'search' && formSnap) {
        const cur = readForm();
        setFormRaw(formSnap.v);
        Promise.resolve(window.CLOUD_authAct(act)).finally(() => { if (page === 'search') setFormRaw(cur); });
        return;
      }
      window.CLOUD_authAct(act);
    }
    document.addEventListener('cloud-auth', e => { user = e.detail?.user || null; renderAccount(); });
  
    function toast(msg) {
      const t = document.createElement('div');
      t.className = 'cl-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3500);
    }
  
    // ── Nút ✎ Note và ⚙ Tùy chọn: đưa vào đầu thanh Xem hạn (#hanNavBar) ──
    function placeHanButtons() {
      const han = $('hanNavBar'), note = $('btnToggleNote'), set = $('btnSettings');
      if (!han || !note || !set || note.parentNode === han) return;
      note.innerHTML = '<span class="hb-ico">✎</span>Note';
      set.innerHTML = '<span class="hb-ico">⚙</span>Tùy chọn';
      const div = document.createElement('span');
      div.className = 'han-nav-divider hb-div';
      div.textContent = '|';
      // sau thanh công cụ vẽ (hàng riêng phía trên), trước "Xem hạn"
      const before = $('btnNoteMobile') || $('chkXemHanLabel') || null;
      han.insertBefore(note, before);
      han.insertBefore(set, before);
      han.insertBefore(div, before);
      // Menu ⚙ mở lên trên, ngay trên nút (nút giờ nằm trong thanh dưới, không còn ở góc cố định)
      set.addEventListener('click', placeSettingsMenu);
      window.addEventListener('resize', () => $('settingsMenu')?.classList.remove('open'));
      window.dispatchEvent(new Event('resize'));               // thanh dưới đổi chiều cao → căn lại lá số
    }
    function placeSettingsMenu() {
      const menu = $('settingsMenu'), set = $('btnSettings');
      if (!menu || !set) return;
      const r = set.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + 'px';
      menu.style.bottom = (window.innerHeight - r.top + 6) + 'px';
    }
  
    // ── Khởi động ───────────────────────────────────────────────
    function init() {
      placeHanButtons();
      build();
      wrapDirtyCheck();
      guardSearchApi();
      user = window.FB?.auth?.currentUser || null;
      renderAccount();
      syncFromTab();
      syncUi();
      // Tab bị đổi từ nơi khác (switchTab gọi từ code khác) → cập nhật trang
      ['tabDL', 'tabAL', 'tabSEARCH', 'tabCFG'].forEach(id => {
        const el = $(id);
        if (el) new MutationObserver(syncFromTab).observe(el, { attributes: true, attributeFilter: ['class'] });
      });
      new MutationObserver(() => {
        if (!isDesktop()) { page = 'laso'; formSnap = null; closeAccMenu(); }
        else syncFromTab();
        syncUi();
        if (typeof scaleGrid === 'function') requestAnimationFrame(() => scaleGrid());
      }).observe(document.body, { attributes: true, attributeFilter: ['data-layout'] });
      const pos = $('searchResultPos');                // có / hết kết quả tìm → hiện / ẩn lá số ở tab Tìm
      if (pos) new MutationObserver(() => { captureResults(); syncUi(); })
        .observe(pos, { childList: true, characterData: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();