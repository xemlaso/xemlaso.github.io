// src/js/cloud/mobile-cloud.js
// ── Giao diện mobile: thanh đáy 4 tab ───────────────────────────
//   🏠 Lá số  : form Dương/Âm lịch + lá số (+ nút 📝 Note trong hàng Xem hạn…)
//   🔍 Tìm    : khung tìm kiếm + danh sách kết quả + hàng ◀ ▶ ☰ ★ + lá số kết quả
//   ☁ Đã lưu : bảng toàn màn hình (đăng nhập + danh sách lá số đã lưu)
//   ⚙ Cấu hình: bảng toàn màn hình
//   • Hai tab Lá số / Tìm nhớ lá số riêng: rời tab Lá số thì chụp lại form, quay về thì
//     điền lại form và lập lại lá số; vào tab Tìm thì mở lại kết quả đang xem.
//   • Bảng: không tạo giao diện mới, chuyển chính #cloudPanel / #notePanel / #cfgPanel vào
//     bảng khi ở mobile, trả về chỗ cũ khi sang desktop.
//   • Desktop giữ nguyên.
(function () {
    'use strict';
  
    const $ = id => document.getElementById(id);
    const isMobile = () => document.body.dataset.layout === 'mobile';
    const hasFn = name => typeof window[name] === 'function';
  
    // Kết quả tìm kiếm giữ nguyên khi lập lá số ở tab Lá số (mobile).
    // controller-core.js / search-laso.js kiểm tra hàm này trước khi xóa kết quả.
    window.SEARCH_PIN_RESULTS = () => isMobile();
  
    // ── Bảng toàn màn hình ──────────────────────────────────────
    const SHEETS = {
      cloud: { id: 'mSheetCloud', title: 'Tài khoản', panel: 'cloudPanel' },
      note:  { id: 'mSheetNote',  title: 'Ghi chú',      panel: 'notePanel',
               extra: '<button type="button" class="m-sheet-save" data-mact="save">💾 Lưu</button>' },
      // đặt trong #formAreaLaso để CSS mobile sẵn có của form vẫn áp dụng
      cfg:   { id: 'mSheetCfg',   title: '⚙ Cấu hình',   panel: 'cfgPanel', host: 'formAreaLaso' },
    };
  
    let bar, noteBtn, openKey = null;
    let page = 'laso';                    // 'home' | 'laso' | 'search'
    let homeFrom = 'laso';                // trang nằm dưới Trang chủ
    const MO_TRANG_CHU = true;            // mở web trên mobile là vào Trang chủ
    let daVaoTrangChu = false;            // chỉ tự vào Trang chủ một lần, lúc trang vừa mở
    let formSnap = null;                  // form của tab Lá số khi chuyển sang tab Tìm
    let cfgReturn = 'DL';                 // tab trước khi mở Cấu hình
    const sheets = {};
    const homes = {};                     // id → comment đánh dấu vị trí desktop
  
    function buildSheet(key) {
      const cfg = SHEETS[key];
      const s = document.createElement('div');
      s.id = cfg.id;
      s.className = 'm-sheet';
      s.setAttribute('role', 'dialog');
      s.setAttribute('aria-modal', 'true');
      s.hidden = true;
      s.innerHTML = `
        <div class="m-sheet-head">
          <span class="m-sheet-title">${cfg.title}</span>
          ${cfg.extra || ''}
          <button type="button" class="m-sheet-close" data-mact="close" aria-label="Đóng">✕</button>
        </div>
        <div class="m-sheet-body"></div>`;
      s.addEventListener('click', e => {
        const a = e.target.closest('[data-mact]')?.dataset.mact;
        if (a === 'close') closeSheet();
        else if (a === 'save' && hasFn('saveLaso')) window.saveLaso();
      });
      (cfg.host && $(cfg.host) || document.body).appendChild(s);
      sheets[key] = s;
    }
  
      // Icon nét mảnh (SVG), màu theo chữ của nút: đang chọn thì vàng
  const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    home:   svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9v11a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9"/>'),
    laso:   svg('<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    user:   svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>'),
    cfg:    svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  };

    function build() {
      bar = document.createElement('div');
      bar.className = 'm-bar';
      bar.innerHTML = `
             <button type="button" class="m-bar-btn" data-go="home"><span class="m-ico">${ICON.home}</span>Trang chủ</button>
      <button type="button" class="m-bar-btn" data-go="laso"><span class="m-ico">${ICON.laso}</span>Lá số</button>
      <button type="button" class="m-bar-btn" data-go="search"><span class="m-ico">${ICON.search}</span>Tìm</button>
      <button type="button" class="m-bar-btn" data-go="cloud"><span class="m-ico">${ICON.user}</span>Tài khoản</button>
      <button type="button" class="m-bar-btn" data-go="cfg"><span class="m-ico">${ICON.cfg}</span>Cấu hình</button>`;
      bar.addEventListener('click', e => {
        const k = e.target.closest('[data-go]')?.dataset.go;
        if (k === 'home' || k === 'laso' || k === 'search') goPage(k);
        else if (k) showSheet(k);
      });
      document.body.appendChild(bar);
      const spacer = document.createElement('div');                 // chừa chỗ cho thanh ở cuối trang
      spacer.className = 'm-bar-spacer';
      document.body.appendChild(spacer);
  
      // Nút 📝 Note trong hàng Xem hạn / Tương tác… (chỉ hiện ở tab Lá số trên mobile)
      noteBtn = document.createElement('button');
      noteBtn.type = 'button';
      noteBtn.id = 'btnNoteMobile';
      noteBtn.className = 'm-note-btn';
      noteBtn.innerHTML = '📝 Note<i class="m-dot"></i>';
      noteBtn.addEventListener('click', () => showSheet('note'));
      const han = $('hanNavBar');
      if (han) han.insertBefore(noteBtn, $('chkXemHanLabel') || han.firstChild);
  
      Object.keys(SHEETS).forEach(buildSheet);
    }
  
    // ── Chuyển khối giữa chỗ gốc (desktop) và chỗ mới (mobile) ──
    function remember(el) {
      if (!el || homes[el.id]) return;
      const mark = document.createComment(' ' + el.id + ' (vị trí desktop) ');
      el.parentNode.insertBefore(mark, el);
      homes[el.id] = mark;
    }
    function moveHome(el) {
      const mark = el && homes[el.id];
      if (mark && el.previousSibling !== mark) mark.parentNode.insertBefore(el, mark.nextSibling);
    }
    function moveTo(el, target, before) {
      if (!el || !target) return;
      remember(el);
      if (el.parentNode !== target || (before && el.nextSibling !== before)) target.insertBefore(el, before || null);
    }
  
    function place() {
      const m = isMobile();
      Object.entries(SHEETS).forEach(([k, c]) => {
        const el = $(c.panel);
        if (m) moveTo(el, sheets[k].querySelector('.m-sheet-body'));
        else moveHome(el);
      });
      // Hàng ◀ ▶ ☰ ★: mobile đặt ngay trên lá số (đầu #lasoWrap), chỉ hiện ở tab Tìm
      const nav = $('searchResultNav'), wrap = $('lasoWrap');
      if (m) moveTo(nav, wrap, wrap?.firstElementChild);
      else moveHome(nav);
  
      if (m && MO_TRANG_CHU && !daVaoTrangChu && page !== 'search') { homeFrom = page; page = 'home'; }
      if (m) daVaoTrangChu = true;

      if (m) {
        const t = window._currentTab;
        if (t === 'CFG' && !openKey && typeof switchTab === 'function') switchTab('DL');
        if (t === 'SEARCH' && page !== 'search') enterSearch(false);   // từ desktop đang ở tab Tìm
      } else {
        if (openKey) closeSheet(true);
        if (page === 'home') page = homeFrom;                            // desktop có Trang chủ riêng (menubar.js)
        if (page === 'search') { page = 'laso'; formSnap = null; }       // desktop tự hiện tab Tìm như cũ
      }
      syncPageClass();
      refreshBar();
    }
  
    // ── Hai tab trang: Lá số / Tìm ──────────────────────────────
    const FORM_IDS = ['hoTen', 'ngay', 'thang', 'nam', 'ngayDL', 'thangDL', 'namDL', 'gio', 'gt'];
    function hasLaso() {
      const w = $('lysoApiWrap');
      return !!$('grid')?.children.length || !!(w && w.style.display !== 'none' && $('lysoApiImage')?.getAttribute('src'));
    }
    function snapForm() {
      const v = {};
      FORM_IDS.forEach(id => { const el = $(id); if (el) v[id] = el.value; });
      const t = window._currentTab;
      return { v, tab: (t === 'AL' ? 'AL' : 'DL'), hadLaso: hasLaso() };
    }
    function restoreForm(s) {
      if (!s) return;
      FORM_IDS.forEach(id => { const el = $(id); if (el && id in s.v) el.value = s.v[id]; });
      if (typeof syncMobilePickersFromInputs === 'function') syncMobilePickersFromInputs();
      if (typeof syncGioToGioXem === 'function') syncGioToGioXem();
    }
    function setFormRaw(v) { FORM_IDS.forEach(id => { const el = $(id); if (el && id in v) el.value = v[id]; }); }
  
    // Cảnh báo "chưa lưu" (F5 / đóng trang) khi đang ở tab Tìm: so form của tab Lá số,
    // không so form đang chứa kết quả tìm
    function wrapDirtyCheck() {
      const orig = window.CLOUD_isDirty;
      if (typeof orig !== 'function' || orig._mobileWrapped) return;
      const wrapped = function () {
        if (!(isMobile() && page === 'search' && formSnap)) return orig();
        const cur = {};
        FORM_IDS.forEach(id => { const el = $(id); if (el) cur[id] = el.value; });
        setFormRaw(formSnap.v);
        try { return orig(); } finally { setFormRaw(cur); }
      };
      wrapped._mobileWrapped = true;
      window.CLOUD_isDirty = wrapped;
    }
  
    const searchIdx = () => (typeof window._currentSearchResultIdx === 'number' ? window._currentSearchResultIdx : -1);
  
    function enterSearch(snap) {
      if (snap !== false) formSnap = snapForm();
      page = 'search';
      if (typeof switchTab === 'function' && window._currentTab !== 'SEARCH') switchTab('SEARCH');
      if (window.SEARCH_RESTORE_IF_LOST?.()) return;                       // kết quả lỡ bị xóa → lấy lại (menubar.js)
      const idx = searchIdx();
      if (idx >= 0 && hasFn('openSearchResult')) window.openSearchResult(idx);   // vẽ lại lá số kết quả đang xem
    }
    function leaveSearch() {
      page = 'laso';
      const s = formSnap;
      formSnap = null;
      restoreForm(s);
      if (typeof switchTab === 'function') switchTab(s ? s.tab : 'DL');
      if (s && s.hadLaso) {
        if (typeof lapLaSo === 'function') lapLaSo();                     // vẽ lại lá số của tab Lá số
      } else {
        const g = $('grid'); if (g) g.innerHTML = '';                    // tab Lá số chưa có lá số
        if (typeof toggleLysoApiMode === 'function') { try { toggleLysoApiMode(false); } catch (e) {} }
        const w = $('lasoWrap'); if (w) w.style.display = 'none';
      }
    }
    const scrollMem = {};                 // vị trí cuộn của từng tab
    function goPage(p) {
      if (!isMobile()) return;
      if (openKey) closeSheet(true);
      if (p === page) {                     // bấm lại tab đang xem → lên đầu trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (p === 'home') {                   // Trang chủ chỉ phủ lên trên: không đổi form, lá số, kết quả tìm
        scrollMem[page] = window.scrollY;
        homeFrom = page; page = 'home';
        syncPageClass(); refreshBar();
        return;
      }
      if (page === 'home') {                // rời Trang chủ: trở về trang bên dưới rồi đi tiếp như thường
        page = homeFrom;
        if (p === page) {
          syncPageClass(); refreshBar();
          requestAnimationFrame(() => window.scrollTo(0, scrollMem[p] || 0));
          return;
        }
      }
      scrollMem[page] = window.scrollY;
      if (p === 'search') enterSearch(); else leaveSearch();
      syncPageClass();
      refreshBar();
      requestAnimationFrame(() => window.scrollTo(0, scrollMem[p] || 0));   // về đúng chỗ đang xem của tab đó
    }
    function syncPageClass() {
      const onSearch = isMobile() && page === 'search';
      document.body.classList.toggle('m-page-search', onSearch);
      document.body.classList.toggle('m-search-empty', onSearch && searchIdx() < 0);
      document.body.classList.toggle('m-page-home', isMobile() && page === 'home');
    }
  
    // Bấm một kết quả tìm → cuộn xuống lá số
    document.addEventListener('click', e => {
      if (!isMobile() || page !== 'search' || !e.target.closest('#searchResultList > div')) return;
      if (e.target.closest('button')) return;                              // nút ★ không cuộn
      setTimeout(() => {
        syncPageClass();
        ($('searchResultNav') || $('lasoWrap'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    });
  
    // ── Bảng ───────────────────────────────────────────────────
    function showSheet(key) {
      const s = sheets[key];
      if (!isMobile() || !s) return;
      if (key === 'note' && !hasLaso()) return;
      if (openKey && openKey !== key) closeSheet(true);
      if (key === 'cfg' && typeof switchTab === 'function') {
        const t = window._currentTab;
        if (t && t !== 'CFG') cfgReturn = t;
        if (t !== 'CFG') switchTab('CFG');
      }
      // Mở "Đã lưu" từ tab Tìm: form đang chứa kết quả tìm → trả form về như ở tab Lá số
      // để laso-cloud không tưởng là "có thay đổi chưa lưu"
      if (key === 'cloud' && page === 'search' && formSnap) restoreForm(formSnap);
      if (key === 'note') {
        const ten = ($('hoTen')?.value || '').trim();
        s.querySelector('.m-sheet-title').textContent = ten ? 'Ghi chú · ' + ten : 'Ghi chú';
      }
      s.hidden = false;
      openKey = key;
      document.documentElement.classList.add('m-sheet-open');
      fitViewport();
      try { history.pushState({ mSheet: s.id }, ''); } catch (e) {}
      refreshBar();
      if (key === 'cloud') s.querySelector('.cl-item.active')?.scrollIntoView({ block: 'nearest' });
    }
    // fromHistory=true: đóng do nút Back / do chuyển layout → không gọi history.back() nữa
    function closeSheet(fromHistory) {
      if (!openKey) return;
      const key = openKey;
      const s = sheets[key];
      openKey = null;
      if (key === 'cfg' && window._currentTab === 'CFG' && typeof switchTab === 'function') switchTab(cfgReturn);
      if (document.activeElement && s.contains(document.activeElement)) document.activeElement.blur();
      s.hidden = true;
      s.style.top = s.style.height = '';
      document.documentElement.classList.remove('m-sheet-open');
      if (!fromHistory && history.state?.mSheet === s.id) { try { history.back(); } catch (e) {} }
      refreshBar();
    }
    window.MCLOUD_closeSheet = () => closeSheet();
    window.addEventListener('popstate', () => { if (openKey) closeSheet(true); });
  
    // Bàn phím ảo: bảng co theo phần màn hình còn thấy
    function fitViewport() {
      const vv = window.visualViewport;
      if (!openKey || !vv) return;
      const s = sheets[openKey];
      s.style.top = vv.offsetTop + 'px';
      s.style.height = vv.height + 'px';
    }
    window.visualViewport?.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('scroll', fitViewport);
  
    // Mở một lá số đã lưu → về tab Lá số (form đã được điền theo lá số vừa mở)
    document.addEventListener('cloud-opened', () => {
      if (!isMobile() || openKey !== 'cloud') return;
      if (page === 'home') { page = homeFrom; syncPageClass(); }           // mở từ Trang chủ → về trang bên dưới
      if (page === 'search') {
        const snap = formSnap;
        page = 'laso'; formSnap = null;
        // Mở lá số mới: form đã điền + đã lập lá số. Mở lại đúng lá số đang mở: form là của tab Lá số
        // (đã trả về khi mở bảng) nhưng lá số còn là kết quả tìm → lập lại.
        if (window._currentTab === 'SEARCH' && typeof switchTab === 'function') switchTab(snap ? snap.tab : 'DL');
        if (typeof lapLaSo === 'function') lapLaSo();
        syncPageClass();
      }
      closeSheet();
      setTimeout(() => ($('lasoWrap') || $('grid'))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
  
    // ── Thanh đáy & nút Note ────────────────────────────────────
    function hasNote() {
      const ed = $('noteEditor');
      const txt = ed ? ed.textContent.replace(/\s+/g, '') : '';
      return !!txt || !!ed?.querySelector('img') || !!$('noteGallery')?.querySelector('.ng-item');
    }
    function refreshBar() {
      if (!bar) return;
      bar.hidden = !(isMobile() && !openKey);
      bar.querySelectorAll('[data-go]').forEach(b => b.classList.toggle('on', b.dataset.go === page));
      if (noteBtn) {
        noteBtn.disabled = !hasLaso();
        noteBtn.classList.toggle('has-dot', hasNote());
      }
    }
    let raf = 0;
    const refreshSoon = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; syncPageClass(); refreshBar(); });
    };
  
    // ── Khởi động ───────────────────────────────────────────────
    function init() {
      wrapDirtyCheck();
      build();
      place();
      new MutationObserver(place).observe(document.body, { attributes: true, attributeFilter: ['data-layout'] });
      const watch = (id, opts) => { const el = $(id); if (el) new MutationObserver(refreshSoon).observe(el, opts); };
      watch('grid', { childList: true });
      watch('lysoApiImage', { attributes: true, attributeFilter: ['src'] });
      watch('lysoApiWrap', { attributes: true, attributeFilter: ['style'] });
      watch('noteEditor', { childList: true, subtree: true, characterData: true });
      watch('notePanel', { childList: true, subtree: true });
      watch('searchResultPos', { childList: true, characterData: true, subtree: true });   // đổi kết quả / xóa kết quả
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && openKey && !document.querySelector('.rc-overlay, .cl-lightbox, .rule-overlay.open')) closeSheet();
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();