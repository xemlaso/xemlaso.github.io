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
             extra: '<button type="button" class="m-sheet-save" data-mact="save">💾 Lưu</button>'
               + '<button type="button" class="m-sheet-mini" data-mact="mini" aria-label="Thu nhỏ / Phóng to">'
               + '<svg class="i-thu" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>'
               + '<svg class="i-phong" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button>' },
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
      if (a === 'close') { if (key === 'note' && mini.on) closeMini(); else closeSheet(); }
      else if (a === 'save' && hasFn('saveLaso')) window.saveLaso();
      else if (a === 'mini') { if (mini.on) expandMini(); else openMini(); }
    });
    (cfg.host && $(cfg.host) || document.body).appendChild(s);
    sheets[key] = s;
    if (key === 'note') bindMini(s);
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
           <button type="button" class="m-bar-btn" data-go="cloud"><span class="m-ico">${ICON.user}</span>Tài khoản</button>
    <button type="button" class="m-bar-btn" data-go="laso"><span class="m-ico">${ICON.laso}</span>Lá số</button>
    <button type="button" class="m-bar-btn" data-go="search"><span class="m-ico">${ICON.search}</span>Chọn giờ</button>
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
      if (mini.on) closeMini();
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
    if (key === 'note' && noteMode === 'mini' && !mini.on) { openMini(); return; }
    if (key === 'note' && mini.on) { mini.side = ''; refreshBar(); return; }   // đang thu nhỏ: hiện lại cửa sổ
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

  // ── Note thu nhỏ: cửa sổ nổi ở dưới, vừa đọc note vừa xem lá số ──
  //   • Kéo thanh tiêu đề lên/xuống: đổi vị trí. Kéo vạch trên cùng: đổi chiều cao.
  //   • Vuốt ngang quá 1/3 màn hình: thu vào mép (nút mũi tên), bấm nút để hiện lại.
  //   • Chế độ (thu nhỏ/phóng to), vị trí, chiều cao nhớ trong phiên; F5 về phóng to.
  let noteMode = 'full';                              // 'full' | 'mini'
  const mini = { on: false, side: '', top: null, h: null };
  let miniTab = null;
  const MINI_MIN_H = 160;

  function miniBounds() {
    const vv = window.visualViewport;
    const off = vv ? vv.offsetTop : 0, vh = vv ? vv.height : window.innerHeight;
    const banPhim = vv && vv.height < window.innerHeight * 0.8;           // bàn phím ảo đang mở
    const barH = !banPhim && bar && !bar.hidden ? bar.getBoundingClientRect().height : 0;
    return { top: off + 6, bottom: (banPhim ? off + vh : window.innerHeight - barH) - 6 };
  }
  function applyMini() {
    const s = sheets.note;
    if (!s || !mini.on) return;
    const b = miniBounds(), maxH = b.bottom - b.top;
    const goc = Math.min(340, Math.max(MINI_MIN_H, Math.round(window.innerHeight * 0.38)));
    const h = Math.min(maxH, Math.max(MINI_MIN_H, mini.h ?? goc));
    const top = Math.min(b.bottom - h, Math.max(b.top, mini.top ?? (b.bottom - h)));
    s.style.top = top + 'px';
    s.style.height = h + 'px';
    document.documentElement.style.setProperty('--m-note-pad', h + 'px');
    if (miniTab) miniTab.style.top = Math.min(b.bottom - 44, top + 8) + 'px';
  }
  function miniTitle() {
    const ten = ($('hoTen')?.value || '').trim();
    sheets.note.querySelector('.m-sheet-title').textContent = ten ? 'Ghi chú · ' + ten : 'Ghi chú';
  }
  function syncMini() {
    const s = sheets.note;
    if (!s) return;
    const coThe = mini.on && isMobile() && page === 'laso' && !openKey && hasLaso();
    const hien = coThe && !mini.side;
    if (mini.on) {
      s.hidden = !hien;
      if (hien) { miniTitle(); applyMini(); }
    }
    document.documentElement.classList.toggle('m-note-mini-on', hien);
    if (miniTab) {
      miniTab.hidden = !(coThe && mini.side);
      miniTab.dataset.side = mini.side || '';
    }
  }
  function openMini() {
    const s = sheets.note;
    if (!s || !isMobile() || !hasLaso()) return;
    if (openKey === 'note') {                                            // từ phóng to → thu nhỏ
      openKey = null;
      document.documentElement.classList.remove('m-sheet-open');
      if (history.state?.mSheet === s.id) { try { history.back(); } catch (e) {} }
    }
    noteMode = 'mini';
    mini.on = true; mini.side = '';
    s.classList.add('m-mini');
    s.removeAttribute('aria-modal');
    refreshBar();
  }
  function expandMini() {
    const s = sheets.note;
    noteMode = 'full';
    closeMini();
    s.setAttribute('aria-modal', 'true');
    showSheet('note');
  }
  function closeMini() {
    const s = sheets.note;
    if (!s) return;
    mini.on = false; mini.side = '';
    if (document.activeElement && s.contains(document.activeElement)) document.activeElement.blur();
    s.classList.remove('m-mini');
    s.hidden = true;
    s.style.top = s.style.height = s.style.transform = s.style.opacity = '';
    refreshBar();
  }

  function bindMini(s) {
    const grip = document.createElement('div');                         // vạch đổi chiều cao
    grip.className = 'm-mini-grip';
    s.insertBefore(grip, s.firstChild);

    miniTab = document.createElement('button');                         // nút mũi tên khi thu vào mép
    miniTab.type = 'button';
    miniTab.className = 'm-note-tab';
    miniTab.hidden = true;
    miniTab.setAttribute('aria-label', 'Hiện lại ghi chú');
    miniTab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    miniTab.addEventListener('click', () => { mini.side = ''; refreshBar(); });
    document.body.appendChild(miniTab);

    const head = s.querySelector('.m-sheet-head');
    let d = null;                                                        // thao tác kéo đang diễn ra
    const start = (e, kieu) => {
      if (!mini.on || e.button > 0) return;
      if (kieu === 'move' && e.target.closest('button')) return;
      const r = s.getBoundingClientRect();
      d = { kieu, id: e.pointerId, x: e.clientX, y: e.clientY, top: r.top, h: r.height, truc: kieu === 'size' ? 'y' : '' };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const move = e => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.truc) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        d.truc = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        s.classList.add('m-mini-drag');
      }
      e.preventDefault();
      const b = miniBounds();
      if (d.kieu === 'size') {                                           // kéo mép trên: đáy giữ nguyên
        const day = d.top + d.h;
        const top = Math.min(day - MINI_MIN_H, Math.max(b.top, d.top + dy));
        mini.top = top; mini.h = day - top;
        applyMini();
      } else if (d.truc === 'y') {
        mini.top = Math.min(b.bottom - d.h, Math.max(b.top, d.top + dy));
        applyMini();
      } else {
        s.style.transform = `translateX(${dx}px)`;
        s.style.opacity = String(Math.max(0.3, 1 - Math.abs(dx) / window.innerWidth));
      }
    };
    const end = e => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x, truc = d.truc;
      d = null;
      s.classList.remove('m-mini-drag');
      s.style.transform = s.style.opacity = '';
      if (truc === 'x' && Math.abs(dx) > window.innerWidth / 3) {
        mini.side = dx > 0 ? 'right' : 'left';
        refreshBar();
      }
    };
    [[head, 'move'], [grip, 'size']].forEach(([el, kieu]) => {
      el.addEventListener('pointerdown', e => start(e, kieu));
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    });
    const fit = () => { if (mini.on && !s.hidden) applyMini(); };
    window.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('scroll', fit);
  }

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
    syncMini();
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