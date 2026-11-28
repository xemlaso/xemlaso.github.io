// src/js/features/gio-controls.js
    // Tên canh giờ + khoảng giờ theo value của ô giờ ("00:00", "02:00" … "22:00", "23:00").
    // Dùng chung: thanh ‹ › Xem hạn, dòng giờ trên lá số, lưu CSDL (canhGio).
    const CANH_GIO_TEN = ['Tý sớm', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    function canhGioInfo(v) {
      const h = parseInt(String(v), 10);
      if (h === 23) return { ten: 'Tý muộn', khoang: '23h–24h' };
      if (!(h >= 0 && h <= 22)) return null;
      const i = Math.floor(((h + 1) % 24) / 2);                 // 0 = Tý sớm … 11 = Hợi
      return { ten: CANH_GIO_TEN[i], khoang: i === 0 ? '0h–1h' : `${i * 2 - 1}h–${i * 2 + 1}h` };
    }
    function canhGioLabel(v) { const c = canhGioInfo(v); return c ? `${c.ten} (${c.khoang})` : ''; }
    window.canhGioInfo = canhGioInfo;
    window.canhGioLabel = canhGioLabel;

// ── Giờ xem hạn (sync với input #gio) ────────────────────
    // Format hiển thị: "Dậu (17:20)" — tên chi + giờ chính xác từ #gio
    function fmtHHMM(h, m) {
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function parseHHMM(str) {
      const parts = (str || '').split(':');
      const h = parseInt(parts[0]);
      const m = parts.length > 1 ? (parseInt(parts[1]) || 0) : 0;
      if (isNaN(h) || h < 0 || h > 23) return null;
      if (isNaN(m) || m < 0 || m > 59) return null;
      return { h, m };
    }

    // Sync #gio → #gioXem: hiện tên canh + khoảng giờ, ví dụ "Tý muộn (23h–24h)", "Thân (15h–17h)"
    function syncGioToGioXem() {
      const ge = document.getElementById('gioXem');
      const v = document.getElementById('gio')?.value || '';
      const lbl = canhGioLabel(v);
      if (!ge || !lbl) return;
      ge.dataset.val = v;
      ge.textContent = lbl;
    }
    
      // ‹ › chuyển giữa 12 canh của cùng một ngày: Tý sớm → Sửu → … → Hợi, quay vòng, KHÔNG đổi ngày.
    // Đang ở Tý muộn: › về Tý sớm, ‹ về Hợi (cùng ngày dương lịch đã nhập).
    function changeGioXem(delta) {
      const gi = document.getElementById('gio');
      if (!gi) return;
      const h = parseInt(gi.value, 10);
      let i = h === 23 ? (delta > 0 ? -1 : 12) : Math.floor(((h + 1) % 24) / 2);
      if (isNaN(i)) i = 0;
      i = ((i + delta) % 12 + 12) % 12;
      gi.value = String(i * 2).padStart(2, '0') + ':00';
      syncGioToGioXem();
      if (typeof syncMobilePickersFromInputs === 'function') syncMobilePickersFromInputs();
      lapLaSo();
    }

    function onNamXemChange() {
      const xemHan = document.getElementById('chkXemHan')?.checked ?? true;
      const bar = document.getElementById('luuModeBar');
      const namNav = document.getElementById('namNavControls');
      const gioNav = document.getElementById('gioNavControls');
      const namXem = document.getElementById('namXem');
      const btnNamPrev = document.getElementById('btnNamXemPrev');
      const btnNamNext = document.getElementById('btnNamXemNext');
      const lysoImg = typeof isLysoTemplateActive === 'function' && isLysoTemplateActive();
      if (bar) bar.style.display = lysoImg ? 'none' : (xemHan ? 'flex' : 'none');
      if (namNav) namNav.classList.toggle('han-disabled', !xemHan);
      if (gioNav) gioNav.classList.remove('han-disabled');
      if (namXem) namXem.classList.toggle('han-disabled', !xemHan);
      if (btnNamPrev) btnNamPrev.disabled = !xemHan;
      if (btnNamNext) btnNamNext.disabled = !xemHan;
      if (_lastJson) {
        const gridEl = document.getElementById('grid');
        TUVI_RENDER.render(_lastJson, gridEl);
        requestAnimationFrame(() => { scaleGrid(); TUVI_RENDER.reRenderPills(); });
      }
      if (typeof refreshLysoImageForNamXem === 'function') refreshLysoImageForNamXem();
    }

    function initDateTimeDefaultsNow() {
      if (window.__dateTimeDefaultsInitDone) return;
      window.__dateTimeDefaultsInitDone = true;
      const now = new Date();
      const dd = now.getDate();
      const mm = now.getMonth() + 1;
      const yy = now.getFullYear();
      const hhmm = fmtHHMM(now.getHours(), now.getMinutes());
      const lunar = solar2Lunar(dd, mm, yy);

      const ngay = document.getElementById('ngay');
      const thang = document.getElementById('thang');
      const nam = document.getElementById('nam');
      const ngayDL = document.getElementById('ngayDL');
      const thangDL = document.getElementById('thangDL');
      const namDL = document.getElementById('namDL');
      const gio = document.getElementById('gio');

      if (ngay) ngay.value = lunar.ngay;
      if (thang) thang.value = lunar.thang;
      if (nam) nam.value = lunar.nam;
      if (ngayDL) ngayDL.value = dd;
      if (thangDL) thangDL.value = mm;
      if (namDL) namDL.value = yy;
      if (gio) gio.value = hhmm;

      syncGioToGioXem();
      if (typeof convertDL === 'function') convertDL();
      if (typeof lapLaSo === 'function') lapLaSo();
      onNamXemChange();
    }

    (function bindGioArrowButtons() {
      const prev = document.getElementById('btnGioXemPrev');
      const next = document.getElementById('btnGioXemNext');
      if (prev) prev.addEventListener('click', () => changeGioXem(-1));
      if (next) next.addEventListener('click', () => changeGioXem(1));
    })();

    initDateTimeDefaultsNow();
