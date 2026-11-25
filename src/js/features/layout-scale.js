// ── Responsive scale lá số ───────────────────────────────
    function browserWindowHeight() {
      // Chiều cao khung cửa sổ đang mở, không phải chiều cao màn hình.
      return document.documentElement.clientHeight || window.innerHeight || 0;
    }

        // ── Làm tròn tỉ lệ để các đường kẻ giữa các cung đậm nhạt đều nhau ──
    //   k = số điểm ảnh thật cho 1px CSS (= scale × devicePixelRatio).
    //   Nếu (bề rộng ô + gap) × k và (chiều cao hàng + gap) × k đều là số nguyên thì mọi đường kẻ
    //   rơi vào cùng một vị trí lẻ trên điểm ảnh → trông giống hệt nhau.
    function gridSnapInfo(grid) {
      const cs = getComputedStyle(grid);
      return {
        colGap: parseFloat(cs.columnGap) || 0,
        rowGap: parseFloat(cs.rowGap) || 0,
        colW: parseFloat(cs.gridTemplateColumns) || 0,                          // 4 cột bằng nhau
        rows: cs.gridTemplateRows.split(' ').map(parseFloat).filter(n => n > 0), // chiều cao thật từng hàng
      };
    }

    function snapScale(grid, info, scale) {
      const dpr = window.devicePixelRatio || 1;
      if (!(scale > 0) || !info.colW) return scale;
      const pitch = info.colW + info.colGap;
      const k = Math.floor(scale * dpr * pitch) / pitch;   // làm tròn xuống: lá số không to hơn chỗ trống
      if (!(k > 0)) return scale;
      // Nới mỗi hàng thêm < 1 điểm ảnh để (cao + gap) × k là số nguyên; vẫn cho hàng tự giãn nếu nội dung dài
      const rows = info.rows.map(h =>
        `minmax(${(Math.ceil((h + info.rowGap) * k - 1e-6) / k - info.rowGap).toFixed(4)}px, auto)`);
      if (rows.length) grid.style.setProperty('grid-template-rows', rows.join(' '), 'important');
      return k / dpr;
    }
    
    function scaleGrid() {
      const outer = document.getElementById('gridScalerOuter');
      const scaler = document.getElementById('gridScaler');
      const grid = document.getElementById('grid');
      const wrap = document.getElementById('lasoWrap');
      if (!scaler || !grid || !outer || !wrap) return;

      scaler.style.zoom = '';
      scaler.style.transform = 'scale(1)';
      outer.style.height = '';
      outer.style.maxHeight = '';
      grid.style.removeProperty('grid-template-rows');                    // đo lại chiều cao hàng tự nhiên

      const gridW = grid.offsetWidth;
      const gridH = grid.offsetHeight;
      if (!gridW || !gridH) return;
      const snapInfo = gridSnapInfo(grid);

      const hanNav = document.getElementById('hanNavBar');
      const hanH = hanNav ? hanNav.offsetHeight : 0;
      const isDesktop = document.body.dataset.layout === 'desktop';

      if (!isDesktop) {
        const targetH = Math.max(0, window.innerHeight - hanH - 10);
        const scale = snapScale(grid, snapInfo, Math.min(outer.clientWidth / gridW, targetH / gridH));
        scaler.style.transformOrigin = 'top center';
        scaler.style.transform = `scale(${scale})`;
        outer.style.height = (grid.offsetHeight * scale) + 'px';
        if (typeof TUVI_RENDER !== 'undefined') TUVI_RENDER.reRenderPills();
        return;
      }

      const viewH = browserWindowHeight();
      const spaceAbove = Math.max(0, outer.getBoundingClientRect().top + window.scrollY);
      const hanCss = hanNav ? getComputedStyle(hanNav) : null;
      const hanMargin = hanCss ? (parseFloat(hanCss.marginTop) || 0) + (parseFloat(hanCss.marginBottom) || 0) : 0;
      const targetH = Math.max(0, viewH - spaceAbove - hanH - hanMargin - 10);
      let scale = Math.min(outer.clientWidth / gridW, targetH / gridH);

      const applyZoom = (nextScale) => {
        nextScale = snapScale(grid, snapInfo, nextScale);
        const h = Math.max(0, grid.offsetHeight * nextScale);
        scaler.style.transformOrigin = 'top center';
        scaler.style.transform = `scale(${nextScale})`;
        outer.style.height = h + 'px';
        outer.style.maxHeight = h + 'px';
        outer.style.overflow = 'hidden';
        return nextScale;
      };
      scale = applyZoom(scale);
      

      if (hanNav) {
        const bottom = hanNav.getBoundingClientRect().bottom + (parseFloat(getComputedStyle(hanNav).marginBottom) || 0);
        const limit = viewH - 10;
        if (bottom > limit + 0.5 && gridH > 0) {
          scale = Math.max(0, (gridH * scale - (bottom - limit)) / gridH);
          applyZoom(scale);
        }
      }

      if (typeof TUVI_RENDER !== 'undefined') TUVI_RENDER.reRenderPills();
    }

    window.addEventListener('resize', scaleGrid);
