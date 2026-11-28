// src/js/app/controller-core.js
// ── Controller: kết nối form → logic → render ────────────
    let _lastJson = null;

    // Dropdown năm DL: (năm hiện tại - 100) → (năm hiện tại + 5), mặc định năm hiện tại
    (function initNamDLSelect() {
      const sel = document.getElementById('namDL');
      if (!sel || sel.tagName !== 'SELECT') return;
      const now = new Date().getFullYear();
      let html = '';
      for (let y = now + 5; y >= now - 100; y--) {
        html += `<option value="${y}"${y === now ? ' selected' : ''}>${y}</option>`;
      }
      sel.innerHTML = html;
    })();
    // Giờ (0–23) → value canh giờ. 23h = Tý muộn "23:00", 0h = Tý sớm "00:00"
    function gioToCanhValue(h) {
      h = +h;
      if (h === 23) return '23:00';
      return String(Math.floor(((h + 1) % 24) / 2) * 2).padStart(2, '0') + ':00';
    }
    function setGioCanh(hhmm) {
      document.getElementById('gio').value = gioToCanhValue(String(hhmm).split(':')[0]);
    }

   

        // Dropdown giờ sinh: mọi lệnh gán gio.value = "HH:MM" tự quy về canh giờ
        (function initGioSelect() {
          const sel = document.getElementById('gio');
          if (!sel || sel.tagName !== 'SELECT') return;
    
          const native = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
          const toCanh = v => {
            const m = String(v ?? '').match(/^\s*(\d{1,2})/);
            return m ? gioToCanhValue(m[1]) : null;
          };
          Object.defineProperty(sel, 'value', {
            get() { return native.get.call(this); },
            set(v) {
              native.set.call(this, toCanh(v) ?? v);
              if (typeof syncGioToGioXem === 'function') syncGioToGioXem();   // mở lá số / gán bằng code → cập nhật thanh ‹ ›
            },
          });
    
          // Mặc định = canh giờ hiện tại
          sel.value = new Date().getHours() + ':00';
          if (typeof syncGioToGioXem === 'function') syncGioToGioXem();
        })();

    // Giờ sinh mặc định = canh giờ hiện tại
    (function initGioCanhHienTai() {
      const sel = document.getElementById('gio');
      if (!sel || sel.tagName !== 'SELECT') return;
      const h = new Date().getHours();
      sel.value = gioToCanhValue(h);
      if (typeof syncGioToGioXem === 'function') syncGioToGioXem();
    })();

    // Dropdown ngày DL: 1 → 31, mặc định 11
    (function initNgayDLSelect() {
      const sel = document.getElementById('ngayDL');
      if (!sel || sel.tagName !== 'SELECT') return;
      let html = '';
      for (let d = 1; d <= 31; d++) {
        html += `<option value="${d}"${d === 11 ? ' selected' : ''}>${d}</option>`;
      }
      sel.innerHTML = html;
    })();

      // ── Ẩn/hiện sidebar trên desktop ──────────────────────────
      function rerenderLaso() {
        if (typeof scaleGrid === 'function') scaleGrid();
        if (typeof applyResponsiveLayout === 'function') applyResponsiveLayout();
        requestAnimationFrame(() => {
          TUVI_RENDER.reRenderPills?.();     // Tuần/Triệt, tam hợp, hóa xuất
          TUVI_RENDER.refreshFly?.();        // mũi tên phi hóa / truy tung + box giữa
          TUVI_RENDER.refreshTuongTac?.();   // box tương tác tứ hóa
        });
      }
  
      function setSidebarHidden(hidden) {
        document.body.classList.toggle('sidebar-hidden', hidden);
        const btn = document.getElementById('btnToggleSidebar');
        if (btn) btn.textContent = hidden ? '⇥' : '⇤';
        try { localStorage.setItem('sidebarHidden', hidden ? '1' : '0'); } catch (e) {}
        // Chờ layout đổi xong (kể cả transition) rồi mới render lại
        setTimeout(rerenderLaso, 220);
      }
  
      function toggleSidebar() {
        setSidebarHidden(!document.body.classList.contains('sidebar-hidden'));
      }
  
      // Khôi phục trạng thái khi mở trang
      try {
        if (localStorage.getItem('sidebarHidden') === '1') setSidebarHidden(true);
      } catch (e) {}
    
      
          // ── Nút copy trong các box Phi hóa / Truy tung / Tương tác tứ hóa ──
    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      const ta = document.createElement('textarea');           // dự phòng khi mở bằng file://
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } finally { ta.remove(); }
      return Promise.resolve();
    }

    document.addEventListener('click', e => {
      const btn = e.target.closest('.box-copy');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();                                      // không kích hoạt click cung
      const box = btn.closest('.tt-chain, .tg-box');
      const lines = [...box.querySelectorAll('.tt-title, .tt-row, .tg-line')]
        .map(el => el.innerText.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      if (box.dataset.title) lines.unshift(box.dataset.title);
      copyText(lines.join('\n')).then(() => {
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '⧉'; }, 1000);
      });
    }, true);

  
      
    function lapLaSo() {
      if ((window._currentTab || 'DL') !== 'SEARCH' && typeof clearSearchResultsState === 'function' && window._searchResults?.length) {
        clearSearchResultsState();
      }
      const errEl = document.getElementById('err');
      errEl.style.display = 'none';

      const tab = window._currentTab || 'DL';
      if (typeof validateLapSoDateInputs === 'function') {
        const check = validateLapSoDateInputs(tab);
        if (check && !check.ok) {
          if (typeof showLapSoValidationDialog === 'function') {
            showLapSoValidationDialog(check.message);
          }
          return;
        }
      }

      const lysoActive = typeof isLysoTemplateActive === 'function' && isLysoTemplateActive();
      if (tab === 'DL' && typeof convertDL === 'function') convertDL();      // convertDL tự tính Tý muộn (23h) sang ngày kế tiếp
      else if (lysoActive && tab !== 'DL' && typeof syncDlInputsFromAmLich === 'function') syncDlInputsFromAmLich();

      if (typeof isLysoTemplateActive === 'function' && isLysoTemplateActive()) {
        try {
          if (typeof renderLysoFromCurrentInputs === 'function' && renderLysoFromCurrentInputs()) {
            const wrap = document.getElementById('lasoWrap');
            const isFirstRender = wrap.style.display === 'none' || wrap.style.display === '';
            wrap.style.display = 'block';
            if (isFirstRender && document.body.dataset.layout !== 'desktop') {   // desktop: lá số đã ở sẵn trong màn hình
              wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            requestAnimationFrame(() => { applyResponsiveLayout(); scaleGrid(); });
            return;
          }
        } catch (e) {
          errEl.textContent = '⚠ ' + e.message;
          errEl.style.display = 'block';
          return;
        }
      } else if (typeof toggleLysoApiMode === 'function') {
        toggleLysoApiMode(false);
      }

      const hoTen = document.getElementById('hoTen').value.trim();
      const ngay = parseInt(document.getElementById('ngay').value);
      const thang = parseInt(document.getElementById('thang').value);
      const nam = parseInt(document.getElementById('nam').value);
      const gioSinh = (v => v === '23:00' ? '00:00' : v)(document.getElementById('gio').value.trim());   // Tý muộn vẫn là giờ Tý khi an sao
      const gioiTinh = document.getElementById('gt').value;

      // Tính toán — logic.js
      let lasoJson;
      try {
        const method = (typeof getCurrentAnSaoMethod === 'function') ? getCurrentAnSaoMethod() : 'trungchau';
        lasoJson = TUVI_LOGIC.compute({ hoTen, ngay, thang, nam, gioSinh, gioiTinh, method });
      } catch (e) {
        errEl.textContent = '⚠ ' + e.message;
        errEl.style.display = 'block';
        return;
      }

      // Lưu lại giờ gốc của form ("23:00" = Tý muộn) để lá số hiển thị đúng; an sao đã dùng gioSinh quy về Tý
      if (lasoJson?.meta) lasoJson.meta.gioSinh = document.getElementById('gio').value.trim();

      // Ngày DL hiển thị trên lá số = ngày người dùng nhập (dân gian đổi ngày lúc 0h).
      // Tý muộn: âm lịch đã tính sang ngày kế tiếp, nhưng DL vẫn là ngày đã nhập (vd 26/4, không phải 27/4).
      if (lasoJson?.meta) {
        const g = id => parseInt(document.getElementById(id)?.value, 10);
        let dl = null;
        if (tab === 'DL') {
          dl = [g('ngayDL'), g('thangDL'), g('namDL')];
        } else if (typeof lunar2Solar === 'function') {                     // tab Âm lịch: quy ngược từ ngày âm
          const s = lunar2Solar(ngay, thang, nam, 0);
          if (s && s[2]) {
            const t = new Date(+s[2], +s[1] - 1, +s[0] - (document.getElementById('gio').value === '23:00' ? 1 : 0));
            dl = [t.getDate(), t.getMonth() + 1, t.getFullYear()];
          }
        }
        if (dl && dl.every(n => n > 0)) lasoJson.meta.dlNhap = { d: dl[0], m: dl[1], y: dl[2] };
      }

      _lastJson = lasoJson;

      // Cập nhật chatbot info
      updateChatInfo(lasoJson);

      // // Tiêu đề
      // document.getElementById('lsTitle').textContent = hoTen
      //   ? `LÁ SỐ TỬ VI — ${hoTen.toUpperCase()}`
      //   : 'LÁ SỐ TỬ VI ĐẨU SỐ';

      // Render — render.js
      const gridEl = document.getElementById('grid');
      TUVI_RENDER.render(lasoJson, gridEl);

      // Hiện lá số — chỉ scroll lần đầu
      const wrap = document.getElementById('lasoWrap');
      const isFirstRender = wrap.style.display === 'none' || wrap.style.display === '';
      wrap.style.display = 'block';
      if (isFirstRender && document.body.dataset.layout !== 'desktop') {   // desktop: lá số đã ở sẵn trong màn hình
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }


      
      // Scale responsive + layout
      requestAnimationFrame(() => { scaleGrid(); applyResponsiveLayout(); });
    }
