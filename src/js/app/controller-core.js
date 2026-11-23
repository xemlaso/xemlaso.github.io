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
    function setGioCanh(hhmm) {
      const [h] = String(hhmm).split(':').map(Number);
      const canh = Math.floor(((h + 1) % 24) / 2);          // 0=Tý … 11=Hợi
      document.getElementById('gio').value = String(canh * 2).padStart(2, '0') + ':00';
    }

        // Dropdown giờ sinh: mọi lệnh gán gio.value = "HH:MM" tự quy về canh giờ
        (function initGioSelect() {
          const sel = document.getElementById('gio');
          if (!sel || sel.tagName !== 'SELECT') return;
    
          const native = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
          const toCanh = v => {
            const m = String(v ?? '').match(/^\s*(\d{1,2})/);
            if (!m) return null;
            const canh = Math.floor(((+m[1] + 1) % 24) / 2);      // 0=Tý … 11=Hợi
            return String(canh * 2).padStart(2, '0') + ':00';
          };
          Object.defineProperty(sel, 'value', {
            get() { return native.get.call(this); },
            set(v) { native.set.call(this, toCanh(v) ?? v); },
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
      const canh = Math.floor(((h + 1) % 24) / 2);              // 0=Tý … 11=Hợi
      sel.value = String(canh * 2).padStart(2, '0') + ':00';
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
      if (tab === 'DL' && typeof convertDL === 'function') convertDL();
      else if (lysoActive && tab !== 'DL' && typeof syncDlInputsFromAmLich === 'function') syncDlInputsFromAmLich();

      if (typeof isLysoTemplateActive === 'function' && isLysoTemplateActive()) {
        try {
          if (typeof renderLysoFromCurrentInputs === 'function' && renderLysoFromCurrentInputs()) {
            const wrap = document.getElementById('lasoWrap');
            const isFirstRender = wrap.style.display === 'none' || wrap.style.display === '';
            wrap.style.display = 'block';
            if (isFirstRender) {
              wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            requestAnimationFrame(() => { applyResponsiveLayout(); });
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
      const gioSinh = document.getElementById('gio').value.trim();
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
      if (isFirstRender) {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Scale responsive + layout
      requestAnimationFrame(() => { scaleGrid(); applyResponsiveLayout(); });
    }
